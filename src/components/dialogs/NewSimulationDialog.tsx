"use client";

import { useId, useState, type FormEvent } from "react";
import { Plus, Table2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface NewSimulationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, options: { prepopulate: boolean }) => void;
}

export function NewSimulationDialog({ open, onClose, onCreate }: NewSimulationDialogProps) {
  const [name, setName] = useState("");
  const [prepopulate, setPrepopulate] = useState(false);
  const formId = useId();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, { prepopulate });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova simulação"
      description="Crie um cenário independente para comparar decisões diferentes."
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl px-4 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form={formId}
            disabled={!name.trim()}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {prepopulate ? <Table2 className="size-4" /> : <Plus className="size-4" />}
            {prepopulate ? "Criar com tabela" : "Criar simulação"}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-2">
        <label
          htmlFor="simulation-name"
          className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
        >
          Nome da simulação
        </label>
        <input
          id="simulation-name"
          autoFocus
          value={name}
          maxLength={60}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Reforma da cozinha"
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600"
        />
        <p className="pt-1 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
          A data e a hora de criação são registradas automaticamente. Você poderá duplicar ou
          excluir esta simulação depois.
        </p>
        <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/40 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/5">
          <input
            type="checkbox"
            checked={prepopulate}
            onChange={(event) => setPrepopulate(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-emerald-600"
          />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-100">
              <Table2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Pré-preencher sobras mensais
            </span>
            <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Usa a tabela de referências de Nov/2026 a Dez/2029, com impacto operacional
              defasado em um mês e as viradas de 2028 e 2029.
            </span>
          </span>
        </label>
      </form>
    </Modal>
  );
}
