"use client";

import { CalendarDays, Pencil, ReceiptText, Trash2 } from "lucide-react";
import type { DebtItem, FeeTable } from "@/types";
import { addMonthsToKey, formatMonthYear, getMonthOptions } from "@/utils/date";
import { calculateDebt } from "@/utils/finance";
import { formatBRL, formatPercent } from "@/utils/format";
import { Modal } from "@/components/ui/Modal";

interface DebtDetailsDialogProps {
  open: boolean;
  debt: DebtItem | null;
  fees: FeeTable;
  selectedInstallment: number;
  onClose: () => void;
  onEdit: (debt: DebtItem) => void;
  onDelete: (debt: DebtItem) => void;
}

export function DebtDetailsDialog({
  open,
  debt,
  fees,
  selectedInstallment,
  onClose,
  onEdit,
  onDelete,
}: DebtDetailsDialogProps) {
  if (!debt) return null;

  const calculation = calculateDebt(debt.netAmount, debt.installments, fees);
  const schedule = getMonthOptions(debt.startMonth, calculation.installments);
  const endMonth = addMonthsToKey(debt.startMonth, calculation.installments - 1);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={debt.name}
      description="Detalhes consolidados do parcelamento e seu impacto mensal."
      footer={
        <>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(debt);
            }}
            className="mr-auto inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            <Pencil className="size-4" />
            Editar dívida
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(debt);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <Trash2 className="size-4" />
            Excluir dívida
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <DetailItem label="Valor líquido" value={formatBRL(calculation.netAmount)} />
          <DetailItem label="Valor bruto" value={formatBRL(calculation.grossAmount)} />
          <DetailItem
            label="Parcela mensal"
            value={formatBRL(calculation.installmentAmount)}
            tone="emerald"
          />
          <DetailItem
            label="Custo da taxa"
            value={formatBRL(calculation.feeCost)}
            tone="amber"
          />
        </div>

        <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex items-start gap-2.5">
            <ReceiptText className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Parcela selecionada
              </p>
              <p className="mt-0.5 text-sm font-bold text-zinc-900 tabular-nums dark:text-zinc-100">
                Parcela {selectedInstallment} de {calculation.installments}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded bg-amber-100 text-[9px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              %
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Taxa Mercado Pago
              </p>
              <p className="mt-0.5 text-sm font-bold text-zinc-900 tabular-nums dark:text-zinc-100">
                {formatPercent(calculation.feePercent, 2)} em {calculation.installments}x
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Início da cobrança
              </p>
              <p className="mt-0.5 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {formatMonthYear(debt.startMonth)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-400" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Término da cobrança
              </p>
              <p className="mt-0.5 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {formatMonthYear(endMonth)}
              </p>
            </div>
          </div>
        </div>

        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Cronograma de impacto
              </h3>
              <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                Desconto mensal desta dívida nas sobras.
              </p>
            </div>
            <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-500 tabular-nums dark:bg-zinc-800 dark:text-zinc-400">
              {schedule.length} meses
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-zinc-50 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:bg-zinc-950/50 dark:text-zinc-500">
              <span>Mês</span>
              <span>Parcela</span>
              <span>Impacto</span>
            </div>
            <ul className="max-h-52 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
              {schedule.map((month, index) => (
                <li
                  key={month.key}
                  className={`grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2 text-xs ${
                    index + 1 === selectedInstallment
                      ? "bg-sky-50 dark:bg-sky-500/10"
                      : "bg-white dark:bg-zinc-900"
                  }`}
                >
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                    {month.label}
                  </span>
                  <span className="text-zinc-400 tabular-nums dark:text-zinc-500">
                    {index + 1}/{schedule.length}
                  </span>
                  <span className="font-bold text-red-600 tabular-nums dark:text-red-400">
                    − {formatBRL(calculation.installmentAmount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </Modal>
  );
}

function DetailItem({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "emerald" | "amber";
}) {
  const valueClass =
    tone === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : "text-zinc-900 dark:text-zinc-100";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 text-sm font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}
