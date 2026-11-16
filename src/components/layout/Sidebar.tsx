"use client";

import {
  CalendarDays,
  Copy,
  Database,
  Pencil,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import type { Simulation } from "@/types";
import { formatDateTimeBR, formatShortMonthYear } from "@/utils/date";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface SidebarProps {
  simulations: Simulation[];
  activeSimulationId: string;
  onSelect: (id: string) => void;
  onRename: (id: string) => void;
  onNew: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onOpenFees: () => void;
}

export function Sidebar({
  simulations,
  activeSimulationId,
  onSelect,
  onRename,
  onNew,
  onDuplicate,
  onDelete,
  onOpenFees,
}: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-zinc-200 bg-white/90 backdrop-blur-xl lg:flex dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex items-center gap-3 px-5 py-5">
        <Image src="/icon.svg" alt="" width={40} height={40} priority />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
            SaldoClaro
          </p>
          <p className="truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Crédito & parcelamentos
          </p>
        </div>
      </div>

      <div className="px-4">
        <button
          type="button"
          onClick={onNew}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          <Plus className="size-4" />
          Nova simulação
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 pt-6">
        <div className="flex items-center justify-between px-2 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
            Simulações
          </span>
          <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500 tabular-nums dark:bg-zinc-800 dark:text-zinc-400">
            {simulations.length}
          </span>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pb-3">
          {simulations.map((simulation) => {
            const isActive = simulation.id === activeSimulationId;
            return (
              <div key={simulation.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(simulation.id)}
                  className={`w-full rounded-xl border py-2.5 pl-3 pr-9 text-left transition ${
                    isActive
                      ? "border-emerald-200 bg-emerald-50/80 shadow-sm dark:border-emerald-500/25 dark:bg-emerald-500/10"
                      : "border-transparent hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-800 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${
                        isActive
                          ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                          : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    />
                    <span
                      className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${
                        isActive
                          ? "text-emerald-950 dark:text-emerald-50"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {simulation.name}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 pl-3.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3" />
                      {formatDateTimeBR(simulation.createdAt)}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span>{formatShortMonthYear(simulation.startMonth)}</span>
                  </div>
                  <div className="mt-1 pl-3.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                    {simulation.debts.length} {simulation.debts.length === 1 ? "dívida" : "dívidas"}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onRename(simulation.id)}
                  aria-label={`Editar título de ${simulation.name}`}
                  title="Editar título"
                  className="absolute right-2 top-2 grid size-7 place-items-center rounded-lg text-zinc-400 opacity-0 transition hover:bg-zinc-200/70 hover:text-zinc-700 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-zinc-700/60 dark:hover:text-zinc-200"
                >
                  <Pencil className="size-3.5" />
                </button>
              </div>
            );
          })}
        </nav>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onDuplicate}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <Copy className="size-3.5" />
            Duplicar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <Trash2 className="size-3.5" />
            Excluir
          </button>
        </div>
      </div>

      <div className="space-y-2 border-t border-zinc-200 p-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={onOpenFees}
          className="flex w-full items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <Settings2 className="size-4" />
          Configurar taxas
        </button>
        <ThemeToggle />
        <div className="flex items-center gap-2 px-1 pt-1 text-[10px] font-medium leading-tight text-zinc-400 dark:text-zinc-500">
          <Database className="size-3.5 shrink-0" />
          Planejamento financeiro claro e seguro
        </div>
      </div>
    </aside>
  );
}
