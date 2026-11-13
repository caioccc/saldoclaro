const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

const MONTH_SHORT_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function monthKeyFromDate(date: Date): string {
  return currentMonthKey(date);
}

export function isValidMonthKey(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

export function parseMonthKey(value: string): { year: number; month: number } | null {
  if (!isValidMonthKey(value)) return null;
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

export function addMonthsToKey(monthKey: string, amount: number): string {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return monthKey;
  const date = new Date(parsed.year, parsed.month - 1 + amount, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function monthDiff(fromKey: string, toKey: string): number {
  const from = parseMonthKey(fromKey);
  const to = parseMonthKey(toKey);
  if (!from || !to) return Number.NaN;
  return (to.year - from.year) * 12 + (to.month - from.month);
}

export function formatMonthYear(monthKey: string): string {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return monthKey;
  return `${MONTH_NAMES[parsed.month - 1]} ${parsed.year}`;
}

export function formatShortMonthYear(monthKey: string): string {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return monthKey;
  return `${MONTH_SHORT_NAMES[parsed.month - 1]}/${parsed.year}`;
}

export function formatDateTimeBR(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function getMonthOptions(
  startMonth: string,
  count: number,
): Array<{ key: string; label: string; shortLabel: string }> {
  return Array.from({ length: count }, (_, index) => {
    const key = addMonthsToKey(startMonth, index);
    return {
      key,
      label: formatMonthYear(key),
      shortLabel: formatShortMonthYear(key),
    };
  });
}
