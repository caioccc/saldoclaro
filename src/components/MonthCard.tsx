"use client";

import { AlertTriangle, CalendarClock, Coins, Sparkles } from "lucide-react";
import type { MonthProjection } from "@/types";
import { formatBRL, formatPercent } from "@/utils/format";

interface MonthCardProps {
  month: MonthProjection;
  isCurrent: boolean;
  highlightedDebtId: string | null;
  onDebtHover: (debtId: string | null) => void;
  onDebtToggle: (debtId: string) => void;
  onDebtClick?: (debtId: string, installmentNumber: number) => void;
}

const TONES = {
  emerald: {
    text: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-gradient-to-r from-emerald-500 to-teal-500",
    soft: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    bar: "bg-gradient-to-r from-amber-400 to-orange-500",
    soft: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  red: {
    text: "text-red-600 dark:text-red-400",
    bar: "bg-gradient-to-r from-red-500 to-rose-500",
    soft: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  },
} as const;

export function MonthCard({
  month,
  isCurrent,
  highlightedDebtId,
  onDebtHover,
  onDebtToggle,
  onDebtClick = () => {},
}: MonthCardProps) {
  const tone =
    month.freePercent > 50 ? "emerald" : month.freePercent >= 20 ? "amber" : "red";
  const palette = TONES[tone];

  return (
    <article
      className={`group flex flex-col self-start overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md dark:bg-zinc-900 ${
        month.isOverBudget
          ? "border-red-200 dark:border-red-500/30"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-start justify-between gap-2 px-4 pb-3 pt-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-sm font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              Ref: {month.referenceMonthLabel}
            </h3>
            {isCurrent ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                <Sparkles className="size-2.5" />
                atual
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Mês operacional · {month.monthLabel}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-bold text-zinc-600 tabular-nums dark:text-zinc-300">
            {formatBRL(month.budget)}
          </p>
          {month.creditAmount > 0 ? (
            <p className="mt-0.5 text-[9px] font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
              + {formatBRL(month.creditAmount)}
            </p>
          ) : null}
          {month.occupied > 0 ? (
            <p className="mt-0.5 text-[9px] font-semibold text-zinc-400 tabular-nums dark:text-zinc-500">
              − {formatBRL(month.occupied)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="px-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Sobra restante
            </p>
            <p
              className={`mt-0.5 text-[22px] font-bold leading-tight tracking-tight tabular-nums ${
                month.isOverBudget
                  ? "text-red-600 dark:text-red-400"
                  : "text-zinc-950 dark:text-zinc-50"
              }`}
            >
              {formatBRL(month.remaining)}
            </p>
          </div>
          {month.isOverBudget ? (
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <AlertTriangle className="size-3" />
              estourado
            </span>
          ) : null}
        </div>

        <div className="mt-3.5">
          <div className="flex items-center justify-between text-[10px] font-semibold">
            <span className="text-zinc-500 dark:text-zinc-400">Capacidade livre</span>
            <span className={`tabular-nums ${palette.text}`}>
              {formatPercent(month.freePercent, 0)}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out ${palette.bar}`}
              style={{ width: `${month.freePercent}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[9px] font-medium text-zinc-400 tabular-nums dark:text-zinc-500">
            <span>0%</span>
            <span>
              {month.occupied > 0
                ? `${formatPercent(month.available > 0 ? (month.occupied / month.available) * 100 : 100, 0)} ocupado`
                : month.available < 0
                  ? "sobra negativa"
                  : "sobra intacta"}
            </span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-100 px-4 pb-4 pt-3 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Ocupação do mês
          </p>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${palette.soft}`}
          >
            {month.debts.length} {month.debts.length === 1 ? "parcela" : "parcelas"}
          </span>
        </div>

        {month.credits.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {month.credits.map((credit) => (
              <li
                key={`credit-${credit.debtId}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-2.5 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/5"
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  <Coins className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">
                      {credit.name}
                    </p>
                    <p className="text-[9px] font-medium text-emerald-600/70 dark:text-emerald-400/70">
                      Crédito recebido neste mês
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] font-bold text-emerald-700 tabular-nums dark:text-emerald-300">
                  + {formatBRL(credit.amount)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {month.debts.length === 0 ? (
          month.credits.length === 0 ? (
            <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-zinc-50 px-2.5 py-2 text-[10px] font-medium text-zinc-400 dark:bg-zinc-950/40 dark:text-zinc-500">
              <CalendarClock className="size-3.5 shrink-0" />
              Nenhuma parcela ativa neste mês
            </p>
          ) : null
        ) : (
          <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1">
            {month.debts.map((debt) => {
              const isDebtHighlighted = highlightedDebtId === debt.debtId;
              const isDimmed = highlightedDebtId !== null && !isDebtHighlighted;

              return (
                <li
                  key={debt.debtId}
                  role="button"
                  tabIndex={0}
                  data-debt-highlight={isDebtHighlighted ? "true" : undefined}
                  title="Clique para abrir os detalhes da dívida"
                  onPointerEnter={(event) => {
                    if (event.pointerType !== "touch") {
                      onDebtHover(debt.debtId);
                    }
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType !== "touch") {
                      onDebtHover(null);
                    }
                  }}
                  onFocus={() => onDebtHover(debt.debtId)}
                  onBlur={() => onDebtHover(null)}
                  onClick={() => {
                    onDebtToggle(debt.debtId);
                    onDebtClick(debt.debtId, debt.installmentNumber);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onDebtToggle(debt.debtId);
                      onDebtClick(debt.debtId, debt.installmentNumber);
                    }
                  }}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 outline-none transition-colors ${
                    isDebtHighlighted
                      ? "border border-sky-300 bg-sky-50 ring-2 ring-sky-200 dark:border-sky-400/50 dark:bg-sky-500/10 dark:ring-sky-400/30"
                      : "border border-transparent bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950/40 dark:hover:bg-zinc-800/60"
                  } ${isDimmed ? "opacity-40" : "opacity-100"} focus-visible:ring-2 focus-visible:ring-sky-400`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                      {debt.name}
                    </p>
                    <p className="text-[9px] font-medium text-zinc-400 tabular-nums dark:text-zinc-500">
                      Parcela {debt.installmentNumber}/{debt.installments}
                      {month.available > 0
                        ? ` · ${formatPercent(debt.percentOfBudget, 0)} da sobra`
                        : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-zinc-700 tabular-nums dark:text-zinc-200">
                    − {formatBRL(debt.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </article>
  );
}
