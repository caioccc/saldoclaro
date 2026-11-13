"use client";

import { useState } from "react";
import { Info, RotateCcw, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { FeeTable } from "@/types";
import { createDefaultFees } from "@/lib/storage";
import {
  DEFAULT_MERCADO_PAGO_FEES,
  MAX_INSTALLMENTS,
  clamp,
  normalizeInstallments,
} from "@/utils/finance";
import { formatPercent } from "@/utils/format";

interface FeesDialogProps {
  open: boolean;
  fees: FeeTable;
  onClose: () => void;
  onSave: (fees: FeeTable) => void;
}

export function FeesDialog({ open, fees, onClose, onSave }: FeesDialogProps) {
  const [draft, setDraft] = useState<FeeTable>(() => ({ ...fees }));

  const updateFee = (installments: number, value: string) => {
    const parsed = Number(value.replace(",", "."));
    setDraft((previous) => ({
      ...previous,
      [installments]: Number.isFinite(parsed) ? clamp(parsed, 0, 99.99) : 0,
    }));
  };

  const resetToDefault = () => setDraft(createDefaultFees());

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Configurar taxas"
      description="Ajuste as taxas totais de recebimento na hora (Tap to Pay Mercado Pago) usadas nas simulações."
      footer={
        <>
          <button
            type="button"
            onClick={resetToDefault}
            className="mr-auto inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <RotateCcw className="size-4" />
            Restaurar padrão
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl px-4 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            <ShieldCheck className="size-4" />
            Salvar taxas
          </button>
        </>
      }
    >
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p className="text-xs leading-relaxed">
          As taxas representam o percentual total cobrado no recebimento na hora para cada número
          de parcelas. Confirme os valores atuais no app do Mercado Pago antes de usar.
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {Array.from({ length: MAX_INSTALLMENTS }, (_, index) => {
          const installments = index + 1;
          const count = normalizeInstallments(installments);
          const isDefault =
            Math.abs(Number(draft[count]) - Number(DEFAULT_MERCADO_PAGO_FEES[count])) < 0.0001;

          return (
            <label
              key={installments}
              className={`flex items-center justify-between gap-4 rounded-xl border px-3.5 py-2.5 transition ${
                isDefault
                  ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/40"
                  : "border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/5"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-700 tabular-nums dark:bg-zinc-800 dark:text-zinc-200">
                  {count}x
                </span>
                <span className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {count === 1 ? "Tap to Pay" : "Parcelado"}
                </span>
                {isDefault ? null : (
                  <span className="hidden rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 lg:inline dark:bg-emerald-500/15 dark:text-emerald-300">
                    editada
                  </span>
                )}
              </span>
              <span className="relative flex shrink-0 items-center">
                <input
                  type="number"
                  min={0}
                  max={99.99}
                  step={0.01}
                  value={Number(draft[count] ?? 0)}
                  onChange={(event) => updateFee(count, event.target.value)}
                  onFocus={(event) => event.target.select()}
                  aria-label={`Taxa para ${count} parcelas em porcentagem`}
                  className="h-9 w-24 rounded-lg border border-zinc-200 bg-white px-2 pr-6 text-right text-sm font-semibold text-zinc-950 tabular-nums outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
                <span className="pointer-events-none absolute right-2 text-xs font-medium text-zinc-400">
                  %
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
        Exemplo atual: 12x com {formatPercent(Number(draft[12] ?? 0))} de taxa total.
      </p>
    </Modal>
  );
}
