"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { CalendarRange, CircleDollarSign } from "lucide-react";
import type { DebtItem, FeeTable, MonthProjection } from "@/types";
import { addMonthsToKey, formatMonthYear, formatShortMonthYear, monthDiff } from "@/utils/date";
import { calculateDebt } from "@/utils/finance";
import { formatBRL, formatPercent } from "@/utils/format";
import { Toggle } from "@/components/ui/Toggle";

interface DebtTimelineGanttProps {
  months: MonthProjection[];
  debts: DebtItem[];
  fees: FeeTable;
  onDebtSelect: (debtId: string, installmentNumber: number) => void;
  onDebtToggle: (debtId: string, active: boolean) => void;
}

const BAR_COLORS = [
  "bg-emerald-500/85 hover:bg-emerald-500 dark:bg-emerald-500/75 dark:hover:bg-emerald-500",
  "bg-sky-500/85 hover:bg-sky-500 dark:bg-sky-500/75 dark:hover:bg-sky-500",
  "bg-violet-500/85 hover:bg-violet-500 dark:bg-violet-500/75 dark:hover:bg-violet-500",
  "bg-amber-500/85 hover:bg-amber-500 dark:bg-amber-500/75 dark:hover:bg-amber-500",
  "bg-rose-500/85 hover:bg-rose-500 dark:bg-rose-500/75 dark:hover:bg-rose-500",
] as const;

type TimelineSortOrder =
  | "start-asc"
  | "start-desc"
  | "installments-desc"
  | "installments-asc"
  | "start-asc-installments-desc"
  | "start-asc-installments-asc"
  | "start-desc-installments-desc"
  | "start-desc-installments-asc";

function getInstallment(debt: DebtItem, monthKey: string): number | null {
  const installment = monthDiff(debt.startMonth, monthKey) + 1;
  return installment >= 1 && installment <= debt.installments ? installment : null;
}

export function DebtTimelineGantt({
  months,
  debts,
  fees,
  onDebtSelect,
  onDebtToggle,
}: DebtTimelineGanttProps) {
  const timelineMonths = useMemo(
    () => months.filter((month) => month.key <= "2029-12"),
    [months],
  );
  const years = useMemo(
    () => Array.from(new Set(timelineMonths.map((month) => month.key.slice(0, 4)))),
    [timelineMonths],
  );
  const [yearFilter, setYearFilter] = useState("all");
  const [rangeStart, setRangeStart] = useState(timelineMonths[0]?.key ?? "");
  const [rangeEnd, setRangeEnd] = useState(timelineMonths[timelineMonths.length - 1]?.key ?? "");
  const [sortOrder, setSortOrder] = useState<TimelineSortOrder>("start-asc");
  const activeYearFilter = yearFilter === "all" || years.includes(yearFilter) ? yearFilter : "all";
  const activeRangeStart = timelineMonths.some((month) => month.key === rangeStart)
    ? rangeStart
    : timelineMonths[0]?.key ?? "";
  const activeRangeEnd = timelineMonths.some((month) => month.key === rangeEnd)
    ? rangeEnd
    : timelineMonths[timelineMonths.length - 1]?.key ?? "";

  const filteredMonths = useMemo(() => {
    if (timelineMonths.length === 0) return [];
    const start = activeRangeStart;
    const end = activeRangeEnd;

    return timelineMonths.filter(
      (month) =>
        month.key >= start &&
        month.key <= end &&
        (activeYearFilter === "all" || month.key.startsWith(`${activeYearFilter}-`)),
    );
  }, [activeRangeEnd, activeRangeStart, activeYearFilter, timelineMonths]);

  const filteredDebts = useMemo(() => {
    if (filteredMonths.length === 0) return [];
    const firstMonth = filteredMonths[0].key;
    const lastMonth = filteredMonths[filteredMonths.length - 1].key;

    return debts
      .filter((debt) => {
        const debtEnd = addMonthsToKey(debt.startMonth, debt.installments - 1);
        return debt.startMonth <= lastMonth && debtEnd >= firstMonth;
      })
      .sort((left, right) => {
        if (sortOrder === "installments-desc" || sortOrder === "installments-asc") {
          const installmentComparison = left.installments - right.installments;
          if (installmentComparison !== 0) {
            return sortOrder === "installments-asc"
              ? installmentComparison
              : -installmentComparison;
          }
        } else {
          const startComparison = left.startMonth.localeCompare(right.startMonth);
          if (startComparison !== 0) {
            return sortOrder.startsWith("start-asc") ? startComparison : -startComparison;
          }
          if (sortOrder.includes("installments-")) {
            const installmentComparison = left.installments - right.installments;
            if (installmentComparison !== 0) {
              return sortOrder.endsWith("installments-asc")
                ? installmentComparison
                : -installmentComparison;
            }
          }
        }
        return left.name.localeCompare(right.name, "pt-BR");
      });
  }, [debts, filteredMonths, sortOrder]);
  const yearGroups = useMemo(() => {
    const groups = new Map<string, MonthProjection[]>();
    for (const month of filteredMonths) {
      const year = month.key.slice(0, 4);
      groups.set(year, [...(groups.get(year) ?? []), month]);
    }
    return Array.from(groups, ([year, yearMonths]) => ({ year, months: yearMonths }));
  }, [filteredMonths]);
  const gridStyle = {
    "--timeline-columns": `220px repeat(${filteredMonths.length}, minmax(96px, 1fr))`,
  } as CSSProperties;

  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-2 border-b border-zinc-100 px-4 py-4 sm:px-5 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
            <CalendarRange className="size-4.5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
              Timeline de parcelamentos
            </h3>
            <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              {filteredMonths.length} meses · {filteredDebts.length} dívidas no período selecionado.
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(130px,0.8fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(150px,1fr)]">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Ano
            <select
              value={activeYearFilter}
              onChange={(event) => {
                const nextYear = event.target.value;
                setYearFilter(nextYear);
                if (nextYear === "all") {
                  setRangeStart(timelineMonths[0]?.key ?? "");
                  setRangeEnd(timelineMonths[timelineMonths.length - 1]?.key ?? "");
                  return;
                }
                const yearMonths = timelineMonths.filter((month) =>
                  month.key.startsWith(`${nextYear}-`),
                );
                setRangeStart(yearMonths[0]?.key ?? "");
                setRangeEnd(yearMonths[yearMonths.length - 1]?.key ?? "");
              }}
              className="mt-1 block h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold normal-case tracking-normal text-zinc-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="all">Todos os anos</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            De
            <select
              value={activeRangeStart}
              onChange={(event) => {
                const nextStart = event.target.value;
                setRangeStart(nextStart);
                if (rangeEnd && nextStart > rangeEnd) setRangeEnd(nextStart);
              }}
              className="mt-1 block h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold normal-case tracking-normal text-zinc-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {timelineMonths.map((month) => (
                <option key={month.key} value={month.key}>
                  {formatMonthYear(month.key)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Até
            <select
              value={activeRangeEnd}
              onChange={(event) => {
                const nextEnd = event.target.value;
                setRangeEnd(nextEnd);
                if (rangeStart && nextEnd < rangeStart) setRangeStart(nextEnd);
              }}
              className="mt-1 block h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold normal-case tracking-normal text-zinc-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {timelineMonths.map((month) => (
                <option key={month.key} value={month.key}>
                  {formatMonthYear(month.key)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Ordenar por
            <select
              value={sortOrder}
              onChange={(event) => {
                const value = event.target.value;
                if (
                  value === "start-desc" ||
                  value === "installments-desc" ||
                  value === "installments-asc" ||
                  value === "start-asc-installments-desc" ||
                  value === "start-asc-installments-asc" ||
                  value === "start-desc-installments-desc" ||
                  value === "start-desc-installments-asc"
                ) {
                  setSortOrder(value);
                } else {
                  setSortOrder("start-asc");
                }
              }}
              className="mt-1 block h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold normal-case tracking-normal text-zinc-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="start-asc">Início mais antigo</option>
              <option value="start-desc">Início mais recente</option>
              <option value="installments-desc">Mais parcelas</option>
              <option value="installments-asc">Menos parcelas</option>
              <option value="start-asc-installments-desc">
                Início antigo + mais parcelas
              </option>
              <option value="start-asc-installments-asc">
                Início antigo + menos parcelas
              </option>
              <option value="start-desc-installments-desc">
                Início recente + mais parcelas
              </option>
              <option value="start-desc-installments-asc">
                Início recente + menos parcelas
              </option>
            </select>
          </label>
        </div>
      </div>

      {filteredMonths.length === 0 ? (
        <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Não há meses ativos para exibir na timeline.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-max" style={gridStyle}>
            <div className="grid grid-cols-[var(--timeline-columns)] border-b border-zinc-200 dark:border-zinc-700">
              <div
                className="sticky left-0 z-30 row-span-2 flex items-center border-r border-zinc-200 bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
                style={{ gridRow: "1 / span 2" }}
              >
                Dívidas
              </div>
              {yearGroups.map((group) => (
                <div
                  key={group.year}
                  className="border-b border-zinc-100 bg-zinc-50/80 px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400"
                  style={{
                    gridColumn: `${filteredMonths.indexOf(group.months[0]) + 2} / span ${group.months.length}`,
                    gridRow: 1,
                  }}
                >
                  {group.year}
                </div>
              ))}
              {filteredMonths.map((month) => (
                <div
                  key={month.key}
                  className="border-l border-zinc-100 px-2 py-2 text-center text-[10px] font-bold text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
                  title={formatMonthYear(month.key)}
                  style={{ gridRow: 2 }}
                >
                  {formatShortMonthYear(month.key)}
                </div>
              ))}
            </div>

            {debts.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Adicione uma dívida para visualizar o parcelamento.
              </div>
            ) : (
              filteredDebts.map((debt, debtIndex) => {
                const calculation = calculateDebt(debt.netAmount, debt.installments, fees);
                const color = BAR_COLORS[debtIndex % BAR_COLORS.length];

                return (
                  <div
                    key={debt.id}
                    className={`grid min-h-20 grid-cols-[var(--timeline-columns)] border-b border-zinc-100 last:border-b-0 dark:border-zinc-800 ${
                      debt.active ? "" : "opacity-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onDebtSelect(debt.id, 1)}
                      className="sticky left-0 z-20 flex min-w-0 items-center gap-2 border-r border-zinc-200 bg-white px-3 py-3 text-left transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    >
                      <CircleDollarSign className="size-4 shrink-0 text-zinc-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-zinc-800 dark:text-zinc-100">
                          {debt.name}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                          <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 font-bold tabular-nums dark:bg-zinc-800">
                            {calculation.installments}x
                          </span>
                          <span className="tabular-nums">{formatBRL(calculation.installmentAmount)}</span>
                        </span>
                      </span>
                      <span onClick={(event) => event.stopPropagation()}>
                        <Toggle
                          checked={debt.active}
                          onChange={(active) => onDebtToggle(debt.id, active)}
                          label={`${debt.active ? "Desativar" : "Ativar"} ${debt.name}`}
                        />
                      </span>
                    </button>

                    {filteredMonths.map((month) => {
                      const installment = getInstallment(debt, month.key);
                      return (
                        <div
                          key={month.key}
                          className="relative flex items-center justify-center border-l border-zinc-100 px-1 dark:border-zinc-800"
                        >
                          {installment ? (
                            <button
                              type="button"
                              onClick={() => onDebtSelect(debt.id, installment)}
                              title={`${debt.name} · Parcela ${installment} de ${calculation.installments} · ${formatBRL(calculation.installmentAmount)} · Taxa ${formatPercent(calculation.feePercent, 2)}`}
                              className={`group relative flex h-11 w-full min-w-[84px] flex-col items-center justify-center rounded-lg px-1 text-[10px] font-bold text-white shadow-sm transition hover:z-10 hover:scale-[1.03] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${debt.active ? color : "bg-zinc-400 dark:bg-zinc-600"}`}
                            >
                              <span className="tabular-nums">
                                {installment}/{calculation.installments}
                              </span>
                              <span className="max-w-full truncate text-[9px] font-medium tabular-nums opacity-90">
                                {formatBRL(calculation.installmentAmount)}
                              </span>
                              <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-52 -translate-x-1/2 rounded-xl bg-zinc-950 p-2.5 text-left text-[10px] font-medium text-white shadow-xl group-hover:block dark:bg-white dark:text-zinc-900">
                                <span className="block font-bold">{debt.name}</span>
                                <span className="mt-1 block">
                                  Parcela {installment} de {calculation.installments}
                                </span>
                                <span className="block tabular-nums">
                                  Líquido: {formatBRL(calculation.netAmount)}
                                </span>
                                <span className="block tabular-nums">
                                  Parcela: {formatBRL(calculation.installmentAmount)}
                                </span>
                                <span className="block tabular-nums">
                                  Taxa: {formatPercent(calculation.feePercent, 2)}
                                </span>
                              </span>
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}

            <div className="grid min-h-24 grid-cols-[var(--timeline-columns)] bg-zinc-50/80 dark:bg-zinc-950/40">
              <div className="sticky left-0 z-20 border-r border-zinc-200 bg-zinc-50 px-3 py-3 dark:border-zinc-700 dark:bg-zinc-950">
                <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-100">
                  Resumo mensal
                </span>
                <span className="mt-1 block text-[10px] text-zinc-500 dark:text-zinc-400">
                  Comprometido · sobra restante
                </span>
              </div>
              {filteredMonths.map((month) => (
                <div
                  key={month.key}
                  className="flex flex-col items-center justify-center gap-1 border-l border-zinc-200 px-1 text-center dark:border-zinc-700"
                >
                  <span className="text-[10px] font-bold text-amber-600 tabular-nums dark:text-amber-400">
                    {formatBRL(month.occupied)}
                  </span>
                  <span
                    className={`text-[10px] font-bold tabular-nums ${
                      month.remaining < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {formatBRL(month.remaining)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
