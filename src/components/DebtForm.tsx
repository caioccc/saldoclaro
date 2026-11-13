"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownRight,
  CalendarClock,
  Calculator,
  Coins,
  CreditCard,
  Landmark,
  PencilLine,
  Plus,
  ReceiptText,
  X,
} from "lucide-react";
import type { DebtFormValues, DebtItem, FeeTable } from "@/types";
import {
  MAX_INSTALLMENTS,
  MAX_NET_AMOUNT,
  MIN_INSTALLMENTS,
  calculateDebt,
  clamp,
  getFeePercent,
  normalizeInstallments,
} from "@/utils/finance";
import { addMonthsToKey, formatMonthYear, getMonthOptions } from "@/utils/date";
import { formatBRL, formatPercent } from "@/utils/format";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { RangeInput } from "@/components/ui/RangeInput";
import { Toggle } from "@/components/ui/Toggle";

interface DebtFormProps {
  fees: FeeTable;
  startMonth: string;
  horizonMonths: number;
  editingDebt: DebtItem | null;
  onSubmit: (values: DebtFormValues) => void;
  onCancelEdit: () => void;
}

export function DebtForm({
  fees,
  startMonth,
  horizonMonths,
  editingDebt,
  onSubmit,
  onCancelEdit,
}: DebtFormProps) {
  const [name, setName] = useState(editingDebt?.name ?? "");
  const [netAmount, setNetAmount] = useState(editingDebt?.netAmount ?? 0);
  const [installments, setInstallments] = useState(editingDebt?.installments ?? 12);
  const [debtStartMonth, setDebtStartMonth] = useState(
    editingDebt?.startMonth ?? startMonth,
  );
  const initialCreditMonth =
    editingDebt?.creditMonth ?? addMonthsToKey(editingDebt?.startMonth ?? startMonth, -1);
  const [creditMonth, setCreditMonth] = useState(initialCreditMonth);
  const [creditMonthTouched, setCreditMonthTouched] = useState(
    editingDebt
      ? initialCreditMonth !== addMonthsToKey(editingDebt.startMonth, -1)
      : false,
  );
  const [creditInPreviousMonth, setCreditInPreviousMonth] = useState(
    editingDebt?.creditInPreviousMonth ?? false,
  );
  const [touched, setTouched] = useState(false);

  const monthOptions = useMemo(() => {
    const options = getMonthOptions(startMonth, Math.max(MAX_INSTALLMENTS, horizonMonths));
    if (editingDebt && !options.some((month) => month.key === editingDebt.startMonth)) {
      options.unshift(getMonthOptions(editingDebt.startMonth, 1)[0]);
    }
    return options;
  }, [editingDebt, horizonMonths, startMonth]);

  const creditMonthOptions = useMemo(() => {
    const options = getMonthOptions(
      addMonthsToKey(startMonth, -1),
      Math.max(MAX_INSTALLMENTS, horizonMonths) + 1,
    );
    if (!options.some((month) => month.key === creditMonth)) {
      options.unshift(getMonthOptions(creditMonth, 1)[0]);
    }
    return options;
  }, [creditMonth, horizonMonths, startMonth]);

  const effectiveStartMonth = monthOptions.some((month) => month.key === debtStartMonth)
    ? debtStartMonth
    : startMonth;
  const effectiveCreditMonth = creditMonthOptions.some((month) => month.key === creditMonth)
    ? creditMonth
    : addMonthsToKey(startMonth, -1);

  const calculation = calculateDebt(netAmount, installments, fees);
  const feePercent = getFeePercent(fees, installments);
  const lastInstallmentMonth = addMonthsToKey(effectiveStartMonth, installments - 1);
  const creditBeforeHorizon = effectiveCreditMonth < startMonth;
  const isValid = name.trim().length > 0 && netAmount > 0;

  const handleDebtStartMonthChange = (value: string) => {
    const previousCreditMonth = addMonthsToKey(debtStartMonth, -1);
    setDebtStartMonth(value);
    if (!creditMonthTouched || creditMonth === previousCreditMonth) {
      setCreditMonth(addMonthsToKey(value, -1));
    }
  };

  const resetForm = () => {
    setName("");
    setNetAmount(0);
    setInstallments(12);
    setDebtStartMonth(startMonth);
    setCreditMonth(addMonthsToKey(startMonth, -1));
    setCreditMonthTouched(false);
    setCreditInPreviousMonth(false);
    setTouched(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;

    const safeStartMonth = effectiveStartMonth;

    onSubmit({
      name: name.trim(),
      netAmount: Math.round(clamp(netAmount, 0, MAX_NET_AMOUNT) * 100) / 100,
      installments: normalizeInstallments(installments),
      startMonth: safeStartMonth,
      creditInPreviousMonth,
      creditMonth: creditInPreviousMonth ? effectiveCreditMonth : undefined,
    });

    if (!editingDebt) resetForm();
  };

  return (
    <section
      id="debt-form"
      className="scroll-mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-4 sm:px-5 dark:border-zinc-800">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CreditCard className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {editingDebt ? "Editar dívida" : "Adicionar dívida"}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Saque no cartão com recebimento na hora
          </p>
        </div>
        {editingDebt ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <PencilLine className="size-3" />
            editando
          </span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            novo item
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-5">
        <div>
          <label
            htmlFor="debt-name"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
          >
            Nome da dívida
          </label>
          <input
            id="debt-name"
            value={name}
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Notebook, fornecedor X..."
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600"
          />
        </div>

        <div>
          <div className="mb-2 flex items-end justify-between gap-3">
            <label
              htmlFor="debt-net-amount"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              Valor líquido desejado
            </label>
            <span className="text-sm font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
              {formatBRL(netAmount)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <RangeInput
              value={Math.min(netAmount, MAX_NET_AMOUNT)}
              min={0}
              max={MAX_NET_AMOUNT}
              step={50}
              onChange={(value) => setNetAmount(value)}
              ariaLabel="Valor líquido desejado"
            />
            <CurrencyInput
              id="debt-net-amount"
              value={netAmount}
              onChange={(value) => setNetAmount(clamp(value, 0, MAX_NET_AMOUNT))}
              ariaLabel="Valor líquido desejado em reais"
              className="w-32 shrink-0"
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
            <span>R$ 0</span>
            <span>R$ 100.000</span>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-end justify-between gap-3">
            <label
              htmlFor="debt-installments"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              Número de parcelas
            </label>
            <span className="text-sm font-bold text-zinc-950 tabular-nums dark:text-zinc-50">
              {installments}x
            </span>
          </div>
          <div className="flex items-center gap-3">
            <RangeInput
              value={installments}
              min={MIN_INSTALLMENTS}
              max={MAX_INSTALLMENTS}
              step={1}
              onChange={(value) => setInstallments(normalizeInstallments(value))}
              ariaLabel="Número de parcelas"
            />
            <div className="relative w-24 shrink-0">
              <input
                id="debt-installments"
                type="number"
                min={MIN_INSTALLMENTS}
                max={MAX_INSTALLMENTS}
                step={1}
                value={installments}
                onFocus={(event) => event.target.select()}
                onChange={(event) => {
                  const parsed = Number(event.target.value);
                  setInstallments(Number.isFinite(parsed) ? normalizeInstallments(parsed) : 1);
                }}
                aria-label="Número de parcelas"
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 pr-8 text-right text-sm font-semibold text-zinc-950 tabular-nums shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-zinc-400">
                x
              </span>
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
            <span>1x</span>
            <span>18x</span>
          </div>
        </div>

        <div>
          <label
            htmlFor="debt-start-month"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
          >
            Mês da 1ª parcela
          </label>
          <div className="relative">
            <Landmark className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <select
              id="debt-start-month"
              value={effectiveStartMonth}
              onChange={(event) => handleDebtStartMonthChange(event.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-zinc-200 bg-white pl-9 pr-9 text-sm font-medium text-zinc-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              {monthOptions.map((month) => (
                <option key={month.key} value={month.key}>
                  {month.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
              ▾
            </span>
          </div>
          <p className="mt-1.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
            Primeira parcela em{" "}
            <span className="font-bold text-zinc-700 dark:text-zinc-200">
              {formatMonthYear(effectiveStartMonth)}
            </span>
            {" · "}última em{" "}
            <span className="font-bold text-zinc-700 dark:text-zinc-200">
              {formatMonthYear(lastInstallmentMonth)}
            </span>
          </p>
        </div>

        <div
          className={`rounded-xl border p-3 transition ${
            creditInPreviousMonth
              ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/5"
              : "border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950/30"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                <Coins className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                Crédito recebido
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                {creditInPreviousMonth
                  ? `O valor líquido será somado à sobra de ${formatMonthYear(effectiveCreditMonth)}.`
                  : "Ative para lançar o valor líquido desta dívida como crédito em um mês específico."}
              </p>
            </div>
            <Toggle
              checked={creditInPreviousMonth}
              onChange={setCreditInPreviousMonth}
              label="Usar dívida como crédito"
            />
          </div>

          {creditInPreviousMonth ? (
            <div className="mt-3 border-t border-emerald-200/70 pt-3 dark:border-emerald-500/20">
              <label
                htmlFor="debt-credit-month"
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300"
              >
                Mês de recebimento do crédito
              </label>
              <div className="relative">
                <CalendarClock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
                <select
                  id="debt-credit-month"
                  value={effectiveCreditMonth}
                  onChange={(event) => {
                    setCreditMonth(event.target.value);
                    setCreditMonthTouched(true);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-emerald-200 bg-white pl-9 pr-9 text-sm font-medium text-zinc-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-500/30 dark:bg-zinc-950 dark:text-zinc-50"
                >
                  {creditMonthOptions.map((month) => (
                    <option key={month.key} value={month.key}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  ▾
                </span>
              </div>
              {creditBeforeHorizon ? (
                <p className="mt-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  Este crédito fica antes do início da simulação e não aparece no horizonte atual.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50/60 p-4 dark:border-emerald-500/20 dark:from-emerald-500/10 dark:to-teal-500/5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
              <Calculator className="size-3.5" />
              Prévia do saque
            </span>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700 tabular-nums shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300">
              taxa {formatPercent(feePercent, 2)}
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-white/70 p-2.5 shadow-sm dark:bg-zinc-950/30">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Valor bruto
              </dt>
              <dd className="mt-0.5 text-sm font-bold text-zinc-950 tabular-nums dark:text-zinc-50">
                {formatBRL(calculation.grossAmount)}
              </dd>
            </div>
            <div className="rounded-xl bg-white/70 p-2.5 shadow-sm dark:bg-zinc-950/30">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Parcela mensal
              </dt>
              <dd className="mt-0.5 text-sm font-bold text-emerald-700 tabular-nums dark:text-emerald-300">
                {formatBRL(calculation.installmentAmount)}
              </dd>
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-xl bg-white/70 px-2.5 py-2 shadow-sm dark:bg-zinc-950/30">
              <dt className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <ReceiptText className="size-3" />
                Custo total da taxa
              </dt>
              <dd className="text-xs font-bold text-amber-600 tabular-nums dark:text-amber-400">
                {formatBRL(calculation.feeCost)}
              </dd>
            </div>
          </dl>

          <p className="mt-2.5 flex items-start gap-1.5 text-[10px] leading-relaxed text-emerald-800/80 dark:text-emerald-200/70">
            <ArrowDownRight className="mt-0.5 size-3 shrink-0" />
            Você recebe {formatBRL(netAmount)} líquidos e paga {installments}x de{" "}
            {formatBRL(calculation.installmentAmount)} no cartão.
          </p>
        </div>

        {touched && !isValid ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
            Informe um nome e um valor líquido maior que zero.
          </p>
        ) : null}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!isValid}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {editingDebt ? <PencilLine className="size-4" /> : <Plus className="size-4" />}
            {editingDebt ? "Salvar alterações" : "Adicionar dívida"}
          </button>
          {editingDebt ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <X className="size-4" />
              Cancelar
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
