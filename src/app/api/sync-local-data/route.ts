import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import type { AppState, Simulation } from "@/types";
import { getAuthenticatedUser } from "@/lib/auth";
import { parseAppState, createDefaultFees, normalizeFeeTable } from "@/lib/storage";
import { ensureDatabaseSchema, prisma } from "@/lib/prisma";

function toDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Data inválida recebida na sincronização.");
  }
  return date;
}

function serializeSimulation(
  simulation: Prisma.SimulationGetPayload<{
    include: { budgets: true; debts: true };
  }>,
): Simulation {
  const budgets: Record<string, number> = {};
  for (const budget of simulation.budgets) {
    const key = `${budget.year}-${String(budget.month).padStart(2, "0")}`;
    budgets[key] = Number(budget.initialValue);
  }

  return {
    id: simulation.id,
    name: simulation.name,
    createdAt: simulation.createdAt.toISOString(),
    startMonth: simulation.startMonth,
    ...(simulation.horizonMonths ? { horizonMonths: simulation.horizonMonths } : {}),
    budgets,
    debts: simulation.debts.map((debt) => ({
      id: debt.id,
      name: debt.name,
      netAmount: Number(debt.netAmount),
      installments: debt.installments,
      startMonth: debt.startMonth,
      creditInPreviousMonth: debt.creditInPreviousMonth,
      ...(debt.creditMonth ? { creditMonth: debt.creditMonth } : {}),
      active: debt.active,
      createdAt: debt.createdAt.toISOString(),
    })),
  };
}

export async function GET() {
  try {
    await ensureDatabaseSchema();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const [simulations, settings] = await Promise.all([
      prisma.simulation.findMany({
        where: { ownerId: user.id },
        include: { budgets: true, debts: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.appSettings.findUnique({ where: { id: "default" } }),
    ]);

    const serialized = simulations.map(serializeSimulation);
    return NextResponse.json({
      version: 1,
      simulations: serialized,
      activeSimulationId: serialized[0]?.id ?? "",
      fees: settings ? normalizeFeeTable(settings.fees) : createDefaultFees(),
    } satisfies AppState);
  } catch (error) {
    console.error("Falha ao carregar dados do banco.", error);
    return NextResponse.json({ error: "Não foi possível carregar os dados." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const app = parseAppState(await request.json());
    if (!app) {
      return NextResponse.json({ error: "Payload de sincronização inválido." }, { status: 400 });
    }

    const fees: Prisma.InputJsonValue = Object.fromEntries(
      Object.entries(app.fees).map(([installments, fee]) => [installments, fee]),
    );

    await prisma.$transaction(async (transaction) => {
      await transaction.simulation.updateMany({
        where: { ownerId: null },
        data: { ownerId: user.id },
      });

      for (const simulation of app.simulations) {
        const existing = await transaction.simulation.findUnique({
          where: { id: simulation.id },
          select: { ownerId: true },
        });
        if (existing?.ownerId && existing.ownerId !== user.id) {
          throw new Error("A simulação pertence a outro usuário.");
        }

        await transaction.simulation.upsert({
          where: { id: simulation.id },
          create: {
            id: simulation.id,
            ownerId: user.id,
            name: simulation.name,
            createdAt: toDate(simulation.createdAt),
            startMonth: simulation.startMonth,
            horizonMonths: simulation.horizonMonths,
          },
          update: {
            ownerId: user.id,
            name: simulation.name,
            startMonth: simulation.startMonth,
            horizonMonths: simulation.horizonMonths,
          },
        });

        await transaction.monthBudget.deleteMany({ where: { simulationId: simulation.id } });
        await transaction.debtItem.deleteMany({ where: { simulationId: simulation.id } });

        const budgets = Object.entries(simulation.budgets).map(([key, initialValue]) => {
          const [year, month] = key.split("-").map(Number);
          return {
            id: `${simulation.id}:${key}`,
            simulationId: simulation.id,
            month,
            year,
            initialValue,
          };
        });
        if (budgets.length > 0) {
          await transaction.monthBudget.createMany({ data: budgets });
        }

        if (simulation.debts.length > 0) {
          await transaction.debtItem.createMany({
            data: simulation.debts.map((debt) => ({
              id: debt.id,
              simulationId: simulation.id,
              name: debt.name,
              netAmount: debt.netAmount,
              installments: debt.installments,
              startMonth: debt.startMonth,
              creditInPreviousMonth: debt.creditInPreviousMonth,
              creditMonth: debt.creditMonth,
              active: debt.active,
              createdAt: toDate(debt.createdAt),
            })),
          });
        }
      }

      await transaction.appSettings.upsert({
        where: { id: "default" },
        create: { id: "default", fees },
        update: { fees },
      });
    });

    return NextResponse.json({ ok: true, syncedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Falha ao sincronizar dados locais com o banco.", error);
    return NextResponse.json(
      { error: "Não foi possível salvar os dados no banco." },
      { status: 500 },
    );
  }
}
