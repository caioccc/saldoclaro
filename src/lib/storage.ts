import type { AppState, DebtItem, FeeTable, Simulation } from "@/types";
import { currentMonthKey, isValidMonthKey } from "@/utils/date";
import {
  DEFAULT_MERCADO_PAGO_FEES,
  MAX_BUDGET_AMOUNT,
  MAX_INSTALLMENTS,
  MAX_NET_AMOUNT,
  MIN_BUDGET_AMOUNT,
  clamp,
  normalizeInstallments,
} from "@/utils/finance";
import { createId } from "@/utils/id";
import {
  PREPOPULATED_START_MONTH,
  budgetToMonthKey,
  generatePrepopulatedBudgets,
  referenceMonthToOperationalMonthKey,
} from "@/utils/prepopulate";

export const THEME_COOKIE_NAME = "saldoclaro_theme";

export function createDefaultFees(): FeeTable {
  return { ...DEFAULT_MERCADO_PAGO_FEES };
}

export function createSimulation(
  name: string,
  startMonth = currentMonthKey(),
): Simulation {
  return {
    id: createId("sim"),
    name: name.trim() || "Minha simulação",
    createdAt: new Date().toISOString(),
    startMonth,
    budgets: {},
    debts: [],
  };
}

export function createDefaultAppState(): AppState {
  const simulation = createSimulation("Minha simulação");
  return {
    version: 1,
    simulations: [simulation],
    activeSimulationId: simulation.id,
    fees: createDefaultFees(),
  };
}

export function duplicateSimulation(simulation: Simulation): Simulation {
  return {
    ...simulation,
    id: createId("sim"),
    name: `${simulation.name} (cópia)`,
    createdAt: new Date().toISOString(),
    budgets: { ...simulation.budgets },
    debts: simulation.debts.map((debt) => ({
      ...debt,
      id: createId("debt"),
      createdAt: new Date().toISOString(),
    })),
  };
}

export function createPrepopulatedSimulation(name: string): Simulation {
  const budgets = generatePrepopulatedBudgets();
  const budgetRecord: Record<string, number> = {};

  for (const budget of budgets) {
    const referenceMonth = budgetToMonthKey(budget);
    budgetRecord[referenceMonthToOperationalMonthKey(referenceMonth)] = budget.sobraInicial;
  }

  return {
    ...createSimulation(name, PREPOPULATED_START_MONTH),
    horizonMonths: budgets.length,
    budgets: budgetRecord,
  };
}

export function normalizeFeeTable(value: unknown): FeeTable {
  const fees = createDefaultFees();
  if (!value || typeof value !== "object") return fees;

  for (let index = 1; index <= MAX_INSTALLMENTS; index += 1) {
    const raw = Number((value as Record<string, unknown>)[index]);
    if (Number.isFinite(raw) && raw >= 0 && raw <= 99.99) {
      fees[index] = Math.round(raw * 100) / 100;
    }
  }

  return fees;
}

function normalizeDebt(value: unknown, fallbackMonth: string): DebtItem | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const netAmount = Number(raw.netAmount);
  const creditInPreviousMonth = raw.creditInPreviousMonth === true;
  const creditMonth =
    creditInPreviousMonth && isValidMonthKey(raw.creditMonth) ? raw.creditMonth : undefined;

  if (!Number.isFinite(netAmount)) return null;

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : createId("debt"),
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "Dívida sem nome",
    netAmount: clamp(netAmount, 0, MAX_NET_AMOUNT),
    installments: normalizeInstallments(Number(raw.installments)),
    startMonth: isValidMonthKey(raw.startMonth) ? raw.startMonth : fallbackMonth,
    creditInPreviousMonth,
    ...(creditMonth ? { creditMonth } : {}),
    active: raw.active !== false,
    createdAt:
      typeof raw.createdAt === "string" && !Number.isNaN(new Date(raw.createdAt).getTime())
        ? raw.createdAt
        : new Date().toISOString(),
  };
}

function normalizeSimulation(value: unknown, index: number): Simulation | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const startMonth = isValidMonthKey(raw.startMonth) ? raw.startMonth : currentMonthKey();
  const budgets: Record<string, number> = {};

  if (raw.budgets && typeof raw.budgets === "object") {
    for (const [key, amount] of Object.entries(raw.budgets as Record<string, unknown>)) {
      const parsed = Number(amount);
      if (isValidMonthKey(key) && Number.isFinite(parsed)) {
        budgets[key] = clamp(parsed, MIN_BUDGET_AMOUNT, MAX_BUDGET_AMOUNT);
      }
    }
  }

  const debts = Array.isArray(raw.debts)
    ? raw.debts
        .map((debt) => normalizeDebt(debt, startMonth))
        .filter((debt): debt is DebtItem => debt !== null)
    : [];

  const rawHorizon = Number(raw.horizonMonths);
  const horizonMonths =
    Number.isInteger(rawHorizon) && rawHorizon >= 1 && rawHorizon <= 60
      ? rawHorizon
      : undefined;

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : createId("sim"),
    name:
      typeof raw.name === "string" && raw.name.trim()
        ? raw.name.trim()
        : `Simulação ${index + 1}`,
    createdAt:
      typeof raw.createdAt === "string" && !Number.isNaN(new Date(raw.createdAt).getTime())
        ? raw.createdAt
        : new Date().toISOString(),
    startMonth,
    ...(horizonMonths ? { horizonMonths } : {}),
    budgets,
    debts,
  };
}

export function parseAppState(value: unknown): AppState | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const simulations = Array.isArray(raw.simulations)
    ? raw.simulations
        .map((simulation, index) => normalizeSimulation(simulation, index))
        .filter((simulation): simulation is Simulation => simulation !== null)
    : [];

  if (simulations.length === 0) return createDefaultAppState();

  const requestedActive =
    typeof raw.activeSimulationId === "string" ? raw.activeSimulationId : "";
  const activeSimulationId = simulations.some((simulation) => simulation.id === requestedActive)
    ? requestedActive
    : simulations[0].id;

  return {
    version: 1,
    simulations,
    activeSimulationId,
    fees: normalizeFeeTable(raw.fees),
  };
}


