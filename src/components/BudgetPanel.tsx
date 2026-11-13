"use client";

import { useMemo, useState } from "react";
import { CalendarRange, ChevronDown, CopyCheck, Wallet } from "lucide-react";
import type { Simulation } from "@/types";
import { MAX_BUDGET_AMOUNT, MIN_BUDGET_AMOUNT, clamp } from "@/utils/finance";
import { getMonthOptions } from "@/utils/date";
import { formatBRL } from "@/utils/format";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

interface BudgetPanelProps {
  simulation: Simulation;
  visibleStartMonth: string;
  visibleMonths: number;
  onStartMonthChange: (monthKey: string) => void;
  onBudgetChange: (monthKey: string, amount: number) => void;
  onReplicate: (amount: number) => void;
}

export function BudgetPanel({
  simulation,
  visibleStartMonth,
  visibleMonths,
  onStartMonthChange,
  onBudgetChange,
  onReplicate,
}: BudgetPanelProps) {
  const [replicateValue, setReplicateValue] = useState(0);
  const months = useMemo(
    () => getMonthOptions(visibleStartMonth, visibleMonths),
    [visibleMonths, visibleStartMonth],
  );
  const total = useMemo(
    () =>
      months.reduce((sum, month) => {
        const value = Number(simulation.budgets[month.key] ?? 0);
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0),
    [months, simulation.budgets],
  );
  const [open, setOpen] = useState(total === 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-zinc-50/70 sm:px-5 dark:hover:bg-zinc-800/40"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
          <Wallet className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Sobras mensais
          </span>
          <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
            {visibleMonths === 0
              ? "Nenhum mês ativo a partir do mês atual"
              : `Base de orçamento para os próximos ${visibleMonths} meses`}
          </span>
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Total no horizonte
          </span>
          <span className="block text-sm font-bold text-zinc-950 tabular-nums dark:text-zinc-50">
            {formatBRL(total)}
          </span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="border-t border-zinc-100 px-4 py-5 sm:px-5 dark:border-zinc-800">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="start-month"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
              >
                <CalendarRange className="size-3.5" />
                Mês de início
              </label>
              <input
                id="start-month"
                type="month"
                value={simulation.startMonth}
                onChange={(event) => {
                  if (event.target.value) onStartMonthChange(event.target.value);
                }}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-950 shadow-sm outline-none transition [color-scheme:light] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:[color-scheme:dark]"
              />
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Replicar valor
              </span>
              <div className="flex gap-2">
                <CurrencyInput
                  value={replicateValue}
                  onChange={(value) =>
                    setReplicateValue(clamp(value, MIN_BUDGET_AMOUNT, MAX_BUDGET_AMOUNT))
                  }
                  min={MIN_BUDGET_AMOUNT}
                  max={MAX_BUDGET_AMOUNT}
                  ariaLabel="Valor de sobra para replicar em todos os meses"
                  className="min-w-0 flex-1"
                />
                <button
                  type="button"
                  onClick={() => onReplicate(replicateValue)}
                  disabled={visibleMonths === 0}
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                >
                  <CopyCheck className="size-4" />
                  <span className="hidden sm:inline">Replicar para todos</span>
                  <span className="sm:hidden">Aplicar</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {months.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-3 py-4 text-xs font-medium text-zinc-500 sm:col-span-2 xl:col-span-3 dark:border-zinc-800 dark:text-zinc-400">
                O horizonte desta simulação terminou. Ajuste o mês de início para voltar a
                configurar sobras mensais.
              </p>
            ) : null}
            {months.map((month, index) => (
              <div
                key={month.key}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                      {month.label}
                    </span>
                    {index === 0 ? (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        1º
                      </span>
                    ) : null}
                  </div>
                  <span className="mt-0.5 block text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                    Sobra disponível
                  </span>
                </div>
                <CurrencyInput
                  value={Number(simulation.budgets[month.key] ?? 0)}
                  onChange={(value) => onBudgetChange(month.key, value)}
                  min={MIN_BUDGET_AMOUNT}
                  max={MAX_BUDGET_AMOUNT}
                  ariaLabel={`Sobra mensal de ${month.label}`}
                  className="w-[7.5rem] shrink-0"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-1 border-t border-dashed border-zinc-200 pt-4 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-700 dark:text-zinc-400">
            <p>Edite meses específicos depois de replicar — útil para 13º salário, férias etc.</p>
            <p className="font-semibold text-zinc-700 dark:text-zinc-200">
              Total: <span className="tabular-nums">{formatBRL(total)}</span>
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
