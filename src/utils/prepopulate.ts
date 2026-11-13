import type { MonthBudget } from "@/types";
import { addMonthsToKey } from "@/utils/date";
import { parseLocaleNumber } from "@/utils/format";

export const PREPOPULATED_REFERENCE_START_MONTH = "2026-11";
export const PREPOPULATED_START_MONTH = "2026-12";

interface SeedRow {
  month: number;
  year: number;
  value: string;
}

const BASE_SEED_ROWS: readonly SeedRow[] = [
  { month: 11, year: 2026, value: "R$ -2.943,05" },
  { month: 12, year: 2026, value: "R$ 528,26" },
  { month: 1, year: 2027, value: "R$ 1.217,52" },
  { month: 2, year: 2027, value: "R$ 1.136,52" },
  { month: 3, year: 2027, value: "R$ 1.153,34" },
  { month: 4, year: 2027, value: "R$ 1.199,89" },
  { month: 5, year: 2027, value: "R$ 1.191,20" },
  { month: 6, year: 2027, value: "R$ 1.284,50" },
  { month: 7, year: 2027, value: "R$ 1.184,51" },
  { month: 8, year: 2027, value: "R$ 1.267,75" },
  { month: 9, year: 2027, value: "R$ 1.510,59" },
  { month: 10, year: 2027, value: "R$ 1.260,59" },
  { month: 11, year: 2027, value: "R$ 1.333,82" },
  { month: 12, year: 2027, value: "R$ 1.513,82" },
  { month: 1, year: 2028, value: "R$ 1.703,89" },
  { month: 2, year: 2028, value: "R$ 1.762,24" },
  { month: 3, year: 2028, value: "R$ 1.762,24" },
];

interface SeedPosition {
  month: number;
  year: number;
}

function addMonth(year: number, month: number) {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

function createReplicatedRows(
  start: SeedPosition,
  end: SeedPosition,
  value: string,
): SeedRow[] {
  const rows: SeedRow[] = [];
  let cursor = { ...start };

  while (cursor.year < end.year || (cursor.year === end.year && cursor.month <= end.month)) {
    rows.push({ ...cursor, value });
    cursor = addMonth(cursor.year, cursor.month);
  }

  return rows;
}

const SEED_ROWS: readonly SeedRow[] = [
  ...BASE_SEED_ROWS,
  ...createReplicatedRows({ month: 4, year: 2028 }, { month: 1, year: 2029 }, "R$ 1.692,24"),
  ...createReplicatedRows({ month: 2, year: 2029 }, { month: 12, year: 2029 }, "R$ 3.254,86"),
];

export function generatePrepopulatedBudgets(): MonthBudget[] {
  return SEED_ROWS.map((row) => ({
    "mês": row.month,
    ano: row.year,
    sobraInicial: parseLocaleNumber(row.value),
  }));
}

export function budgetToMonthKey(budget: MonthBudget): string {
  return `${budget.ano}-${String(budget["mês"]).padStart(2, "0")}`;
}

export function referenceMonthToOperationalMonthKey(referenceMonthKey: string): string {
  return addMonthsToKey(referenceMonthKey, 1);
}
