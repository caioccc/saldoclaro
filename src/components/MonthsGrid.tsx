"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { BarChart3, ChevronDown, Table2 } from "lucide-react";
import type { DebtItem, FeeTable, MonthProjection } from "@/types";
import { currentMonthKey, formatMonthYear } from "@/utils/date";
import { formatBRL } from "@/utils/format";
import { MonthCard } from "@/components/MonthCard";
import { DebtTimelineGantt } from "@/components/DebtTimelineGantt";

interface MonthsGridProps {
  months: MonthProjection[];
  startMonth: string;
  debts: DebtItem[];
  fees: FeeTable;
  onDebtSelect: (debtId: string, installmentNumber: number) => void;
  onDebtToggle: (debtId: string, active: boolean) => void;
}

interface YearGroup {
  year: string;
  months: MonthProjection[];
  totalBudget: number;
  totalCredits: number;
  totalOccupied: number;
  remaining: number;
}

export function MonthsGrid({
  months,
  startMonth,
  debts,
  fees,
  onDebtSelect,
  onDebtToggle,
}: MonthsGridProps) {
  const current = currentMonthKey();
  const idPrefix = useId();
  const [closedYears, setClosedYears] = useState<Record<string, boolean>>({});
  const [hoveredDebtId, setHoveredDebtId] = useState<string | null>(null);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [view, setView] = useState<"cards" | "timeline">("cards");
  const highlightedDebtId = hoveredDebtId ?? selectedDebtId;

  const yearGroups = useMemo<YearGroup[]>(() => {
    const groups = new Map<string, MonthProjection[]>();

    for (const month of months) {
      const year = month.key.slice(0, 4);
      const yearMonths = groups.get(year);

      if (yearMonths) {
        yearMonths.push(month);
      } else {
        groups.set(year, [month]);
      }
    }

    return Array.from(groups, ([year, yearMonths]) => ({
      year,
      months: yearMonths,
      totalBudget: yearMonths.reduce((total, month) => total + month.budget, 0),
      totalCredits: yearMonths.reduce((total, month) => total + month.creditAmount, 0),
      totalOccupied: yearMonths.reduce((total, month) => total + month.occupied, 0),
      remaining: yearMonths.reduce((total, month) => total + month.remaining, 0),
    }));
  }, [months]);

  const toggleYear = (year: string) => {
    setClosedYears((previous) => ({ ...previous, [year]: !previous[year] }));
  };

  const handleDebtHover = useCallback((debtId: string | null) => {
    setHoveredDebtId(debtId);
  }, []);

  const handleDebtToggle = useCallback((debtId: string) => {
    setSelectedDebtId((previous) => (previous === debtId ? null : debtId));
  }, []);

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Projeção mensal
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {months.length} meses a partir de {formatMonthYear(startMonth)} · agrupados por ano
          </p>
          <p className="mt-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
            Passe o mouse ou clique em uma parcela para destacar a mesma dívida em todos os meses.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950/50">
            <button
              type="button"
              onClick={() => setView("cards")}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-bold transition ${
                view === "cards"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <Table2 className="size-3.5" />
              Cards anuais
            </button>
            <button
              type="button"
              onClick={() => setView("timeline")}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-bold transition ${
                view === "timeline"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <BarChart3 className="size-3.5" />
              Timeline
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            Livre &gt; 50%
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" />
            Atenção 20–50%
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-red-500" />
            Crítico &lt; 20%
          </span>
          </div>
        </div>
      </div>

      {view === "timeline" ? (
        <DebtTimelineGantt
          months={months}
          debts={debts}
          fees={fees}
          onDebtSelect={onDebtSelect}
          onDebtToggle={onDebtToggle}
        />
      ) : (
      <div className="space-y-5">
        {yearGroups.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Nenhum mês ativo
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500 dark:text-zinc-400">
              O horizonte desta simulação terminou antes do mês atual. Ajuste o mês de início ou
              crie uma nova simulação para continuar.
            </p>
          </div>
        ) : null}
        {yearGroups.map((group) => {
          const isOpen = !closedYears[group.year];
          const panelId = `${idPrefix}-year-${group.year}`;

          return (
            <section
              key={group.year}
              data-year={group.year}
              className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <header className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5 dark:border-zinc-800">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleYear(group.year)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    aria-label={`${isOpen ? "Recolher" : "Expandir"} ${group.year}`}
                    className="grid size-8 shrink-0 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                  >
                    <ChevronDown
                      className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-bold leading-none tracking-tight text-zinc-950 tabular-nums dark:text-zinc-50">
                      {group.year}
                    </h3>
                    <p className="mt-1.5 truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      {group.months.length} meses
                      {group.totalCredits > 0
                        ? ` · +${formatBRL(group.totalCredits)} em créditos`
                        : ""}
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-3 gap-2 rounded-xl bg-zinc-50 p-2 sm:flex sm:items-end sm:gap-5 sm:bg-transparent sm:p-0 dark:bg-zinc-950/40 dark:sm:bg-transparent">
                  <div className="min-w-0 px-1 py-0.5 text-left sm:px-0 sm:text-right">
                    <dt
                      title="Total de sobras iniciais no ano"
                      className="truncate text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
                    >
                      Sobras iniciais
                    </dt>
                    <dd className="mt-0.5 truncate text-xs font-bold text-zinc-700 tabular-nums dark:text-zinc-200">
                      {formatBRL(group.totalBudget)}
                    </dd>
                  </div>
                  <div className="min-w-0 px-1 py-0.5 text-left sm:px-0 sm:text-right">
                    <dt
                      title="Total comprometido com parcelas no ano"
                      className="truncate text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
                    >
                      Comprometido
                    </dt>
                    <dd className="mt-0.5 truncate text-xs font-bold text-amber-600 tabular-nums dark:text-amber-400">
                      {formatBRL(group.totalOccupied)}
                    </dd>
                  </div>
                  <div className="min-w-0 px-1 py-0.5 text-left sm:px-0 sm:text-right">
                    <dt
                      title="Saldo livre no ano, incluindo créditos"
                      className="truncate text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
                    >
                      Saldo livre
                    </dt>
                    <dd
                      className={`mt-0.5 truncate text-xs font-bold tabular-nums ${
                        group.remaining < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {formatBRL(group.remaining)}
                    </dd>
                  </div>
                </dl>
              </header>

              <div
                id={panelId}
                data-year-grid={group.year}
                className={
                  isOpen
                    ? "grid grid-cols-1 items-start gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:p-5"
                    : "hidden"
                }
              >
                {group.months.map((month) => (
                  <MonthCard
                    key={month.key}
                    month={month}
                    isCurrent={month.key === current}
                    highlightedDebtId={highlightedDebtId}
                    onDebtHover={handleDebtHover}
                    onDebtToggle={handleDebtToggle}
                    onDebtClick={onDebtSelect}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      )}
    </section>
  );
}
