const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const decimalFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatBRL(value: number): string {
  return brlFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatDecimal(value: number): string {
  return decimalFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function formatPercentValue(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function parseLocaleNumber(input: string): number {
  let normalized = input.replace(/\s/g, "").replace(/R\$/gi, "").trim();
  if (!normalized) return 0;

  if (normalized.includes(",")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    const dots = normalized.match(/\./g) ?? [];
    if (dots.length > 1) {
      normalized = normalized.replace(/\./g, "");
    } else if (dots.length === 1) {
      const decimals = normalized.split(".")[1] ?? "";
      if (decimals.length === 3) normalized = normalized.replace(".", "");
    }
  }

  normalized = normalized.replace(/[^\d.-]/g, "");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
