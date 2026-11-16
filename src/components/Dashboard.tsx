"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Copy,
  Database,
  Info,
  Percent,
  PiggyBank,
  Plus,
  Settings2,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { AppState, DebtFormValues, DebtItem, FeeTable, Simulation } from "@/types";
import {
  HORIZON_MONTHS,
  buildMonthProjections,
  buildSimulationSummary,
  clamp,
  fillMissingBudgets,
  getDebtHorizonMonths,
  getActiveMonthRange,
} from "@/utils/finance";
import {
  formatDateTimeBR,
  formatMonthYear,
  getMonthOptions,
} from "@/utils/date";
import { formatBRL, formatPercent } from "@/utils/format";
import { createId } from "@/utils/id";
import {
  STORAGE_KEY,
  createDefaultAppState,
  createSimulation,
  deserializeAppState,
  duplicateSimulation,
} from "@/lib/storage";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { usePrepopulatedSimulation } from "@/hooks/usePrepopulatedSimulation";
import { useDatabaseSync } from "@/hooks/useDatabaseSync";
import { Sidebar } from "@/components/layout/Sidebar";
import { BudgetPanel } from "@/components/BudgetPanel";
import { DebtForm } from "@/components/DebtForm";
import { DebtList } from "@/components/DebtList";
import { MonthsGrid } from "@/components/MonthsGrid";
import { NewSimulationDialog } from "@/components/dialogs/NewSimulationDialog";
import { FeesDialog } from "@/components/dialogs/FeesDialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { DebtDetailsDialog } from "@/components/dialogs/DebtDetailsDialog";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type SetAppState = (updater: AppState | ((previous: AppState) => AppState)) => void;

const SUMMARY_TONES = {
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    value: "text-emerald-600 dark:text-emerald-400",
  },
  sky: {
    icon: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    value: "text-zinc-950 dark:text-zinc-50",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    value: "text-amber-600 dark:text-amber-400",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    value: "text-zinc-950 dark:text-zinc-50",
  },
  red: {
    icon: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    value: "text-red-600 dark:text-red-400",
  },
} as const;

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone: keyof typeof SUMMARY_TONES;
}

function SummaryCard({ icon: Icon, label, value, hint, tone }: SummaryCardProps) {
  const palette = SUMMARY_TONES[tone];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-2">
        <span className={`grid size-9 place-items-center rounded-lg ${palette.icon}`}>
          <Icon className="size-4" />
        </span>
        <span
          title={hint}
          className="max-w-[65%] truncate rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
        >
          {hint}
        </span>
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-0.5 truncate text-xl font-bold tracking-tight tabular-nums ${palette.value}`}
      >
        {value}
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-[1600px]">
        <div className="hidden h-dvh w-72 shrink-0 border-r border-zinc-200 p-5 lg:block dark:border-zinc-800">
          <div className="h-10 w-40 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-8 h-10 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-6 space-y-2">
            <div className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-5 p-4 sm:p-6 lg:p-8">
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-8 w-64 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              />
            ))}
          </div>
          <div className="h-20 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="h-[420px] animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
            <div className="h-[420px] animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface DashboardContentProps {
  app: AppState;
  setApp: SetAppState;
}

function DashboardContent({ app, setApp }: DashboardContentProps) {
  const [newSimulationOpen, setNewSimulationOpen] = useState(false);
  const [feesOpen, setFeesOpen] = useState(false);
  const [deleteSimulationOpen, setDeleteSimulationOpen] = useState(false);
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [debtToDelete, setDebtToDelete] = useState<DebtItem | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<{
    debtId: string;
    installmentNumber: number;
  } | null>(null);
  const { createSimulationFromTableData } = usePrepopulatedSimulation();

  const simulation =
    app.simulations.find((item) => item.id === app.activeSimulationId) ?? app.simulations[0];
  const horizonMonths = Math.max(
    simulation.horizonMonths ?? HORIZON_MONTHS,
    getDebtHorizonMonths(simulation.startMonth, simulation.debts),
  );
  const projectionBudgets = useMemo(
    () => fillMissingBudgets(simulation.startMonth, horizonMonths, simulation.budgets),
    [horizonMonths, simulation.budgets, simulation.startMonth],
  );
  const projectionSimulation = useMemo(
    () => ({ ...simulation, budgets: projectionBudgets }),
    [projectionBudgets, simulation],
  );
  const activeRange = getActiveMonthRange(simulation.startMonth, horizonMonths);
  const activeStartMonth = activeRange.startMonth;
  const activeMonths = activeRange.months;

  const months = useMemo(
    () =>
      buildMonthProjections({
        startMonth: activeStartMonth,
        budgets: projectionBudgets,
        debts: simulation.debts,
        fees: app.fees,
        months: activeMonths,
        indexOffset: activeRange.skippedMonths,
      }),
    [
      activeMonths,
      activeRange.skippedMonths,
      activeStartMonth,
      app.fees,
      projectionBudgets,
      simulation.debts,
    ],
  );

  const summary = useMemo(
    () => buildSimulationSummary(months, simulation.debts, app.fees),
    [app.fees, months, simulation.debts],
  );

  const editingDebt = simulation.debts.find((debt) => debt.id === editingDebtId) ?? null;
  const selectedDebtItem =
    simulation.debts.find((debt) => debt.id === selectedDebt?.debtId) ?? null;

  const updateActiveSimulation = (updater: (current: Simulation) => Simulation) => {
    setApp((previous) => ({
      ...previous,
      simulations: previous.simulations.map((item) =>
        item.id === previous.activeSimulationId ? updater(item) : item,
      ),
    }));
  };

  const handleCreateSimulation = (
    name: string,
    options: { prepopulate: boolean } = { prepopulate: false },
  ) => {
    if (options.prepopulate) {
      createSimulationFromTableData(name);
    } else {
      const newSimulation = createSimulation(name);
      setApp((previous) => ({
        ...previous,
        simulations: [newSimulation, ...previous.simulations],
        activeSimulationId: newSimulation.id,
      }));
    }
    setEditingDebtId(null);
    setNewSimulationOpen(false);
  };

  const handleSelectSimulation = (id: string) => {
    setApp((previous) => ({ ...previous, activeSimulationId: id }));
    setEditingDebtId(null);
  };

  const handleDuplicateSimulation = () => {
    const copy = duplicateSimulation(simulation);
    setApp((previous) => ({
      ...previous,
      simulations: [copy, ...previous.simulations],
      activeSimulationId: copy.id,
    }));
    setEditingDebtId(null);
  };

  const handleConfirmDeleteSimulation = () => {
    setApp((previous) => {
      const remaining = previous.simulations.filter((item) => item.id !== simulation.id);
      const nextSimulations = remaining.length ? remaining : [createSimulation("Minha simulação")];
      const activeStillExists = nextSimulations.some(
        (item) => item.id === previous.activeSimulationId && item.id !== simulation.id,
      );
      const previousIndex = previous.simulations.findIndex((item) => item.id === simulation.id);
      const fallback =
        nextSimulations[Math.max(0, Math.min(previousIndex, nextSimulations.length - 1))] ??
        nextSimulations[0];

      return {
        ...previous,
        simulations: nextSimulations,
        activeSimulationId: activeStillExists
          ? previous.activeSimulationId
          : simulation.id === previous.activeSimulationId
            ? fallback.id
            : previous.activeSimulationId,
      };
    });
    setEditingDebtId(null);
    setDeleteSimulationOpen(false);
  };

  const handleStartMonthChange = (monthKey: string) => {
    updateActiveSimulation((current) => ({ ...current, startMonth: monthKey }));
  };

  const handleBudgetChange = (monthKey: string, amount: number) => {
    updateActiveSimulation((current) => ({
      ...current,
      budgets: { ...current.budgets, [monthKey]: amount },
    }));
  };

  const handleReplicateBudget = (amount: number) => {
    updateActiveSimulation((current) => {
      const budgets: Record<string, number> = {};
      for (const month of getMonthOptions(activeStartMonth, activeMonths)) {
        budgets[month.key] = amount;
      }
      return { ...current, budgets };
    });
  };

  const handleSaveDebt = (values: DebtFormValues) => {
    updateActiveSimulation((current) => {
      if (editingDebtId) {
        return {
          ...current,
          debts: current.debts.map((debt) =>
            debt.id === editingDebtId ? { ...debt, ...values } : debt,
          ),
        };
      }

      const newDebt: DebtItem = {
        ...values,
        id: createId("debt"),
        active: true,
        createdAt: new Date().toISOString(),
      };

      return { ...current, debts: [newDebt, ...current.debts] };
    });
    setEditingDebtId(null);
  };

  const handleEditDebt = (debt: DebtItem) => {
    setSelectedDebt(null);
    setEditingDebtId(debt.id);
    window.setTimeout(() => {
      document.getElementById("debt-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
  };

  const handleToggleDebt = (debtId: string, active: boolean) => {
    updateActiveSimulation((current) => ({
      ...current,
      debts: current.debts.map((debt) => (debt.id === debtId ? { ...debt, active } : debt)),
    }));
  };

  const handleConfirmDeleteDebt = () => {
    if (!debtToDelete) return;
    const debtId = debtToDelete.id;

    updateActiveSimulation((current) => ({
      ...current,
      debts: current.debts.filter((debt) => debt.id !== debtId),
    }));

    if (editingDebtId === debtId) setEditingDebtId(null);
    setDebtToDelete(null);
  };

  const handleDebtSelect = (debtId: string, installmentNumber: number) => {
    setSelectedDebt({ debtId, installmentNumber });
  };

  const handleSaveFees = (fees: FeeTable) => {
    const normalized: FeeTable = {};
    for (let index = 1; index <= HORIZON_MONTHS; index += 1) {
      normalized[index] = clamp(Number(fees[index] ?? 0), 0, 99.99);
    }
    setApp((previous) => ({ ...previous, fees: normalized }));
    setFeesOpen(false);
  };

  const bannerTone =
    activeMonths === 0
      ? "info"
      : summary.overBudgetMonths > 0
        ? "danger"
        : summary.activeDebts > 0
          ? "success"
          : "info";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar
          simulations={app.simulations}
          activeSimulationId={simulation.id}
          onSelect={handleSelectSimulation}
          onNew={() => setNewSimulationOpen(true)}
          onDuplicate={handleDuplicateSimulation}
          onDelete={() => setDeleteSimulationOpen(true)}
          onOpenFees={() => setFeesOpen(true)}
        />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-xl lg:hidden dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-2.5">
                <Image src="/icon.svg" alt="" width={32} height={32} priority />
                <div>
                  <p className="text-sm font-bold leading-tight tracking-tight">SaldoClaro</p>
                  <p className="text-[9px] font-medium leading-tight text-zinc-500 dark:text-zinc-400">
                    Crédito & parcelamentos
                  </p>
                </div>
              </div>
              <ThemeToggle compact />
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="mb-4 flex gap-2 lg:hidden">
              <label className="sr-only" htmlFor="mobile-simulation-select">
                Simulação ativa
              </label>
              <select
                id="mobile-simulation-select"
                value={simulation.id}
                onChange={(event) => handleSelectSimulation(event.target.value)}
                className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {app.simulations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setNewSimulationOpen(true)}
                aria-label="Nova simulação"
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-zinc-950 text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Simulação ativa
                </p>
                <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
                  {simulation.name}
                </h1>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5" />
                    Criada em {formatDateTimeBR(simulation.createdAt)}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <span>Início em {formatMonthYear(simulation.startMonth)}</span>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Database className="size-3.5" />
                    Persistido no banco
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewSimulationOpen(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-950 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Nova simulação</span>
                </button>
                <button
                  type="button"
                  onClick={handleDuplicateSimulation}
                  title="Duplicar simulação ativa"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  <Copy className="size-4" />
                  <span className="hidden md:inline">Duplicar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFeesOpen(true)}
                  title="Configurar taxas"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  <Settings2 className="size-4" />
                  <span className="hidden md:inline">Taxas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteSimulationOpen(true)}
                  title="Excluir simulação ativa"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                >
                  <Trash2 className="size-4" />
                  <span className="hidden md:inline">Excluir</span>
                </button>
              </div>
            </header>

            <section className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <SummaryCard
                icon={Wallet}
                label="Disponível no horizonte"
                value={formatBRL(summary.totalAvailable)}
                hint={
                  summary.totalCredits > 0
                    ? `+${formatBRL(summary.totalCredits)} crédito`
                    : `${activeMonths} meses`
                }
                tone="sky"
              />
              <SummaryCard
                icon={CalendarClock}
                label="Parcelas no horizonte"
                value={formatBRL(summary.totalOccupied)}
                hint={`${formatPercent(summary.commitmentPercent, 0)} ocupado`}
                tone="amber"
              />
              <SummaryCard
                icon={PiggyBank}
                label="Sobra restante"
                value={formatBRL(summary.remaining)}
                hint={summary.remaining < 0 ? "déficit" : "após parcelas"}
                tone={summary.remaining < 0 ? "red" : "emerald"}
              />
              <SummaryCard
                icon={Percent}
                label="Custo em taxas"
                value={formatBRL(summary.totalFees)}
                hint={`bruto ${formatBRL(summary.totalGross)}`}
                tone="violet"
              />
            </section>

            <div
              className={`mt-4 flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${
                bannerTone === "danger"
                  ? "border-red-200 bg-red-50 text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200"
                  : bannerTone === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-200"
              }`}
            >
              {bannerTone === "danger" ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              ) : bannerTone === "success" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              ) : (
                <Info className="mt-0.5 size-4 shrink-0" />
              )}
              <p className="text-xs font-medium leading-relaxed">
                {bannerTone === "danger"
                  ? `Atenção: ${summary.overBudgetMonths} ${
                      summary.overBudgetMonths === 1 ? "mês está" : "meses estão"
                    } com orçamento estourado. Reduza valores, parcelas ou ajuste as sobras mensais.`
                  : bannerTone === "success"
                    ? `Tudo certo: as ${summary.activeDebts} ${
                        summary.activeDebts === 1 ? "dívida ativa cabe" : "dívidas ativas cabem"
                      } nas sobras configuradas para os ${activeMonths} meses.`
                    : activeMonths === 0
                      ? "O horizonte desta simulação terminou antes do mês atual. Ajuste o mês de início ou crie uma nova simulação para continuar."
                      : "Comece definindo a sobra de cada mês e adicionando uma dívida para ver o impacto em tempo real."}
              </p>
            </div>

            <div className="mt-5">
              <BudgetPanel
                key={simulation.id}
                simulation={projectionSimulation}
                visibleStartMonth={activeStartMonth}
                visibleMonths={activeMonths}
                onStartMonthChange={handleStartMonthChange}
                onBudgetChange={handleBudgetChange}
                onReplicate={handleReplicateBudget}
              />
            </div>

            <div className="mt-5 grid items-start gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <DebtForm
                key={`${simulation.id}:${editingDebt?.id ?? "new"}`}
                fees={app.fees}
                startMonth={simulation.startMonth}
                horizonMonths={horizonMonths}
                editingDebt={editingDebt}
                onSubmit={handleSaveDebt}
                onCancelEdit={() => setEditingDebtId(null)}
              />
              <DebtList
                debts={simulation.debts}
                fees={app.fees}
                editingDebtId={editingDebtId}
                onEdit={handleEditDebt}
                onToggle={handleToggleDebt}
                onDelete={setDebtToDelete}
              />
            </div>

            <div className="mt-8">
              <MonthsGrid
                key={simulation.id}
                months={months}
                startMonth={activeStartMonth}
                debts={simulation.debts}
                fees={app.fees}
                onDebtSelect={handleDebtSelect}
                onDebtToggle={handleToggleDebt}
              />
            </div>

            <footer className="mt-10 flex flex-col gap-1 border-t border-zinc-200 pt-5 text-[10px] leading-relaxed text-zinc-400 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:text-zinc-500">
              <p>
                Cálculo: valor bruto = valor líquido ÷ (1 − taxa). Parcelas iguais do valor bruto.
              </p>
              <p className="inline-flex items-center gap-1.5">
                <Database className="size-3" />
                Neon PostgreSQL como fonte de verdade · localStorage usado apenas como cache de segurança
              </p>
            </footer>
          </main>
        </div>
      </div>

      {newSimulationOpen ? (
        <NewSimulationDialog
          open
          onClose={() => setNewSimulationOpen(false)}
          onCreate={handleCreateSimulation}
        />
      ) : null}

      {feesOpen ? (
        <FeesDialog
          open
          fees={app.fees}
          onClose={() => setFeesOpen(false)}
          onSave={handleSaveFees}
        />
      ) : null}

      <ConfirmDialog
        open={deleteSimulationOpen}
        title="Excluir simulação"
        description={`Tem certeza que deseja excluir "${simulation.name}"? Todos os orçamentos e dívidas deste cenário serão removidos. Se for a única simulação, uma nova será criada automaticamente.`}
        onClose={() => setDeleteSimulationOpen(false)}
        onConfirm={handleConfirmDeleteSimulation}
      />

      <ConfirmDialog
        open={debtToDelete !== null}
        title="Remover dívida"
        description={
          debtToDelete
            ? `A dívida "${debtToDelete.name}" será removida desta simulação. Essa ação não pode ser desfeita.`
            : ""
        }
        onClose={() => setDebtToDelete(null)}
        onConfirm={handleConfirmDeleteDebt}
      />

      <DebtDetailsDialog
        open={selectedDebtItem !== null}
        debt={selectedDebtItem}
        fees={app.fees}
        selectedInstallment={selectedDebt?.installmentNumber ?? 1}
        onClose={() => setSelectedDebt(null)}
        onEdit={handleEditDebt}
        onDelete={(debt) => setDebtToDelete(debt)}
      />
    </div>
  );
}

export default function Dashboard() {
  const { value: app, setValue: setApp, hydrated } = useLocalStorageState<AppState>(
    STORAGE_KEY,
    createDefaultAppState,
    { deserialize: deserializeAppState, persist: false },
  );

  useDatabaseSync(app, hydrated, setApp);

  if (!hydrated || !app) return <DashboardSkeleton />;

  return <DashboardContent app={app} setApp={setApp} />;
}
