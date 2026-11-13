"use client";

import { CreditCard, Pencil, ReceiptText, Trash2 } from "lucide-react";
import type { DebtItem, FeeTable } from "@/types";
import { calculateDebt, resolveCreditMonth, roundCurrency } from "@/utils/finance";
import { formatShortMonthYear } from "@/utils/date";
import { formatBRL, formatPercent } from "@/utils/format";
import { Toggle } from "@/components/ui/Toggle";

interface DebtListProps {
  debts: DebtItem[];
  fees: FeeTable;
  editingDebtId: string | null;
  onEdit: (debt: DebtItem) => void;
  onToggle: (debtId: string, active: boolean) => void;
  onDelete: (debt: DebtItem) => void;
}

export function DebtList({
  debts,
  fees,
  editingDebtId,
  onEdit,
  onToggle,
  onDelete,
}: DebtListProps) {
  const activeCount = debts.filter((debt) => debt.active).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-4 sm:px-5 dark:border-zinc-800">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
          <ReceiptText className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Dívidas da simulação
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {activeCount} {activeCount === 1 ? "ativa" : "ativas"} de {debts.length}
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-500 tabular-nums dark:bg-zinc-800 dark:text-zinc-400">
          {debts.length} total
        </span>
      </div>

      {debts.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
            <CreditCard className="size-6" />
          </span>
          <h3 className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Nenhuma dívida adicionada
          </h3>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Use o formulário ao lado para simular um saque e ver o impacto nas suas sobras
            mensais.
          </p>
        </div>
      ) : (
        <div className="max-h-[46rem] space-y-2 overflow-y-auto p-3 sm:p-4">
          {debts.map((debt) => {
            const calculation = calculateDebt(debt.netAmount, debt.installments, fees);
            const isEditing = debt.id === editingDebtId;

            return (
              <article
                key={debt.id}
                className={`rounded-xl border p-3.5 transition ${
                  isEditing
                    ? "border-amber-300 bg-amber-50/50 ring-2 ring-amber-200/60 dark:border-amber-500/40 dark:bg-amber-500/5 dark:ring-amber-500/20"
                    : debt.active
                      ? "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700"
                      : "border-dashed border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg ${
                      debt.active
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                    }`}
                  >
                    <CreditCard className="size-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3
                          className={`truncate text-[13px] font-semibold ${
                            debt.active
                              ? "text-zinc-950 dark:text-zinc-50"
                              : "text-zinc-500 line-through decoration-zinc-300 dark:text-zinc-400"
                          }`}
                        >
                          {debt.name}
                        </h3>
                        <p className="mt-0.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                          {debt.installments}x · início {formatShortMonthYear(debt.startMonth)} ·{" "}
                          taxa {formatPercent(calculation.feePercent, 2)}
                          {debt.creditInPreviousMonth
                            ? ` · crédito ${formatShortMonthYear(resolveCreditMonth(debt))}`
                            : ""}
                        </p>
                      </div>
                      <Toggle
                        checked={debt.active}
                        onChange={(active) => onToggle(debt.id, active)}
                        label={`${debt.active ? "Desativar" : "Ativar"} ${debt.name}`}
                      />
                    </div>

                    <dl className="mt-2.5 grid grid-cols-3 gap-2 rounded-lg bg-zinc-50 px-2.5 py-2 dark:bg-zinc-900/80">
                      <div>
                        <dt className="text-[9px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                          Parcela
                        </dt>
                        <dd className="mt-0.5 text-[11px] font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                          {formatBRL(calculation.installmentAmount)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[9px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                          Bruto
                        </dt>
                        <dd className="mt-0.5 text-[11px] font-bold text-zinc-700 tabular-nums dark:text-zinc-200">
                          {formatBRL(calculation.grossAmount)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[9px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                          Taxa
                        </dt>
                        <dd className="mt-0.5 text-[11px] font-bold text-amber-600 tabular-nums dark:text-amber-400">
                          {formatBRL(roundCurrency(calculation.feeCost))}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-2.5 flex items-center justify-between">
                      <span
                        className={`text-[10px] font-semibold ${
                          debt.active
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-zinc-400 dark:text-zinc-500"
                        }`}
                      >
                        {debt.active ? "Ativa no orçamento" : "Desativada — fora do cálculo"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(debt)}
                          aria-label={`Editar ${debt.name}`}
                          title="Editar dívida"
                          className="grid size-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(debt)}
                          aria-label={`Remover ${debt.name}`}
                          title="Remover dívida"
                          className="grid size-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
