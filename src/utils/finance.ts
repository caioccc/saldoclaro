import type {
  DebtCalculation,
  DebtItem,
  FeeTable,
  MonthDebtCredit,
  MonthDebtOccupancy,
  MonthProjection,
  SimulationSummary,
} from "@/types";
import {
  addMonthsToKey,
  currentMonthKey,
  formatMonthYear,
  formatShortMonthYear,
  isValidMonthKey,
  monthDiff,
} from "@/utils/date";

export const MIN_INSTALLMENTS = 1;
export const MAX_INSTALLMENTS = 18;
export const MAX_NET_AMOUNT = 100_000;
export const HORIZON_MONTHS = 18;
export const MIN_BUDGET_AMOUNT = -10_000_000;
export const MAX_BUDGET_AMOUNT = 10_000_000;

export const DEFAULT_MERCADO_PAGO_FEES: Readonly<FeeTable> = Object.freeze({
  1: 3.09,
  2: 5.79,
  3: 6.09,
  4: 7.99,
  5: 8.09,
  6: 8.19,
  7: 9.49,
  8: 9.68,
  9: 10.37,
  10: 11.05,
  11: 12.27,
  12: 12.38,
  13: 13.44,
  14: 14.51,
  15: 15.53,
  16: 16.63,
  17: 17.71,
  18: 18.99,
});

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function normalizeInstallments(value: number): number {
  if (!Number.isFinite(value)) return MIN_INSTALLMENTS;
  return Math.round(clamp(value, MIN_INSTALLMENTS, MAX_INSTALLMENTS));
}

export function getFeePercent(fees: FeeTable, installments: number): number {
  const count = normalizeInstallments(installments);
  const fee = Number(fees[count]);
  if (!Number.isFinite(fee)) return 0;
  return clamp(fee, 0, 99.99);
}

export function calculateWithFeePercent(
  netAmount: number,
  installments: number,
  feePercent: number,
): DebtCalculation {
  const safeNet = Math.max(0, Number.isFinite(netAmount) ? netAmount : 0);
  const count = normalizeInstallments(installments);
  const safeFee = clamp(Number.isFinite(feePercent) ? feePercent : 0, 0, 99.99);
  const factor = 1 - safeFee / 100;
  const grossAmount = factor > 0 ? roundCurrency(safeNet / factor) : 0;

  return {
    netAmount: safeNet,
    grossAmount,
    installments: count,
    feePercent: safeFee,
    installmentAmount: count > 0 ? grossAmount / count : 0,
    feeCost: roundCurrency(grossAmount - safeNet),
  };
}

export function calculateDebt(
  netAmount: number,
  installments: number,
  fees: FeeTable,
): DebtCalculation {
  return calculateWithFeePercent(netAmount, installments, getFeePercent(fees, installments));
}

export function getMonthDebts(
  monthKey: string,
  debts: DebtItem[],
  fees: FeeTable,
  budget: number,
): MonthDebtOccupancy[] {
  return debts.flatMap((debt) => {
    if (!debt.active) return [];

    const installmentIndex = monthDiff(debt.startMonth, monthKey);
    const count = normalizeInstallments(debt.installments);
    if (installmentIndex < 0 || installmentIndex >= count) return [];

    const calculation = calculateDebt(debt.netAmount, count, fees);
    return [
      {
        debtId: debt.id,
        name: debt.name,
        installmentNumber: installmentIndex + 1,
        installments: count,
        amount: calculation.installmentAmount,
        percentOfBudget: budget > 0 ? (calculation.installmentAmount / budget) * 100 : 0,
      },
    ];
  });
}

export function resolveCreditMonth(
  debt: Pick<DebtItem, "startMonth" | "creditMonth">,
): string {
  return debt.creditMonth && isValidMonthKey(debt.creditMonth)
    ? debt.creditMonth
    : addMonthsToKey(debt.startMonth, -1);
}

export function getMonthCredits(
  monthKey: string,
  debts: DebtItem[],
  fees: FeeTable,
): MonthDebtCredit[] {
  return debts.flatMap((debt) => {
    if (!debt.active || !debt.creditInPreviousMonth) return [];
    if (resolveCreditMonth(debt) !== monthKey) return [];

    const calculation = calculateDebt(debt.netAmount, debt.installments, fees);
    return [
      {
        debtId: debt.id,
        name: debt.name,
        amount: calculation.netAmount,
      },
    ];
  });
}

export interface ActiveMonthRange {
  startMonth: string;
  endMonth: string;
  months: number;
  skippedMonths: number;
}

export function getActiveMonthRange(
  startMonth: string,
  horizonMonths: number,
  referenceMonth = currentMonthKey(),
): ActiveMonthRange {
  const safeHorizon = Number.isFinite(horizonMonths)
    ? Math.max(1, Math.floor(horizonMonths))
    : HORIZON_MONTHS;
  const endMonth = addMonthsToKey(startMonth, safeHorizon - 1);
  const activeStartMonth = startMonth > referenceMonth ? startMonth : referenceMonth;
  const months = Math.max(0, monthDiff(activeStartMonth, endMonth) + 1);
  const skippedMonths = Math.max(0, monthDiff(startMonth, activeStartMonth));

  return { startMonth: activeStartMonth, endMonth, months, skippedMonths };
}

export function getDebtHorizonMonths(
  startMonth: string,
  debts: DebtItem[],
): number {
  return debts.reduce((horizon, debt) => {
    if (!debt.active) return horizon;

    const lastInstallmentMonth = addMonthsToKey(
      debt.startMonth,
      normalizeInstallments(debt.installments) - 1,
    );
    const debtMonths = monthDiff(startMonth, lastInstallmentMonth) + 1;
    return Number.isFinite(debtMonths) ? Math.max(horizon, debtMonths) : horizon;
  }, 0);
}

export function fillMissingBudgets(
  startMonth: string,
  months: number,
  budgets: Record<string, number>,
): Record<string, number> {
  const filled: Record<string, number> = {};
  let previousBudget = 0;

  for (let index = 0; index < Math.max(0, Math.floor(months)); index += 1) {
    const key = addMonthsToKey(startMonth, index);
    const rawBudget = Number(budgets[key]);
    const budget = Number.isFinite(rawBudget) ? clamp(rawBudget, MIN_BUDGET_AMOUNT, MAX_BUDGET_AMOUNT) : previousBudget;
    filled[key] = budget;
    previousBudget = budget;
  }

  return filled;
}

export function buildMonthProjections(params: {
  startMonth: string;
  budgets: Record<string, number>;
  debts: DebtItem[];
  fees: FeeTable;
  months?: number;
  indexOffset?: number;
}): MonthProjection[] {
  const {
    startMonth,
    budgets,
    debts,
    fees,
    months = HORIZON_MONTHS,
    indexOffset = 0,
  } = params;
  const count = Math.max(0, Math.floor(months));

  return Array.from({ length: count }, (_, index) => {
    const key = addMonthsToKey(startMonth, index);
    const referenceMonth = addMonthsToKey(key, -1);
    const rawBudget = Number(budgets[key]);
    const budget = Number.isFinite(rawBudget)
      ? clamp(rawBudget, MIN_BUDGET_AMOUNT, MAX_BUDGET_AMOUNT)
      : 0;
    const credits = getMonthCredits(key, debts, fees);
    const creditAmount = credits.reduce((total, credit) => total + credit.amount, 0);
    const available = budget + creditAmount;
    const debtsInMonth = getMonthDebts(key, debts, fees, available);
    const occupied = debtsInMonth.reduce((total, debt) => total + debt.amount, 0);
    const remaining = available - occupied;
    const freePercent =
      available > 0
        ? clamp(((available - occupied) / available) * 100, 0, 100)
        : available < 0 || occupied > 0
          ? 0
          : 100;

    return {
      key,
      index: indexOffset + index,
      monthLabel: formatMonthYear(key),
      shortLabel: formatShortMonthYear(key),
      referenceMonth,
      referenceMonthLabel: formatMonthYear(referenceMonth),
      budget,
      creditAmount,
      available,
      occupied,
      remaining,
      freePercent,
      isOverBudget: remaining < -0.005,
      credits,
      debts: debtsInMonth,
    };
  });
}

export function buildSimulationSummary(
  months: MonthProjection[],
  debts: DebtItem[],
  fees: FeeTable,
): SimulationSummary {
  const totalBudget = months.reduce((total, month) => total + month.budget, 0);
  const totalCredits = months.reduce((total, month) => total + month.creditAmount, 0);
  const totalAvailable = totalBudget + totalCredits;
  const totalOccupied = months.reduce((total, month) => total + month.occupied, 0);
  const activeDebts = debts.filter((debt) => debt.active);
  const calculations = activeDebts.map((debt) =>
    calculateDebt(debt.netAmount, debt.installments, fees),
  );

  return {
    totalBudget,
    totalCredits,
    totalAvailable,
    totalOccupied,
    remaining: totalAvailable - totalOccupied,
    totalFees: calculations.reduce((total, item) => total + item.feeCost, 0),
    totalGross: calculations.reduce((total, item) => total + item.grossAmount, 0),
    activeDebts: activeDebts.length,
    overBudgetMonths: months.filter((month) => month.isOverBudget).length,
    commitmentPercent: totalAvailable > 0 ? (totalOccupied / totalAvailable) * 100 : 0,
  };
}
