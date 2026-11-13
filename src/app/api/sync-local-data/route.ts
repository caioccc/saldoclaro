import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import type { AppState } from "@/types";
import { parseAppState } from "@/lib/storage";
import { ensureDatabaseSchema, prisma } from "@/lib/prisma";

function isAuthorized(request: Request): boolean {
  const configuredSecret = process.env.SYNC_SECRET;
  const providedSecret = request.headers.get("x-sync-secret");
  return Boolean(configuredSecret && providedSecret && providedSecret === configuredSecret);
}

function toDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Data inválida recebida na sincronização.");
  }
  return date;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Sincronização não autorizada." }, { status: 401 });
  }

  let app: AppState | null;
  try {
    app = parseAppState(await request.json());
  } catch {
    return NextResponse.json({ error: "Payload de sincronização inválido." }, { status: 400 });
  }

  if (!app) {
    return NextResponse.json({ error: "Payload de sincronização inválido." }, { status: 400 });
  }

  try {
    await ensureDatabaseSchema();
    const fees: Prisma.InputJsonValue = Object.fromEntries(
      Object.entries(app.fees).map(([installments, fee]) => [installments, fee]),
    );
    await prisma.$transaction(async (transaction) => {
      for (const simulation of app.simulations) {
        await transaction.simulation.upsert({
          where: { id: simulation.id },
          create: {
            id: simulation.id,
            name: simulation.name,
            createdAt: toDate(simulation.createdAt),
            startMonth: simulation.startMonth,
            horizonMonths: simulation.horizonMonths,
          },
          update: {
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
