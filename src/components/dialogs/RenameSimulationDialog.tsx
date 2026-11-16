"use client";

import { useId, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface RenameSimulationDialogProps {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function RenameSimulationDialog({
  open,
  initialName,
  onClose,
  onSave,
}: RenameSimulationDialogProps) {
  const [name, setName] = useState(initialName);
  const formId = useId();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar título"
      description="Escolha um nome que ajude a identificar este cenário."
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
            <Check className="size-4" />
            Salvar
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-2">
        <label
          htmlFor="simulation-rename"
          className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
        >
          Título da simulação
        </label>
        <input
          id="simulation-rename"
          autoFocus
          value={name}
          maxLength={60}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Reforma da cozinha"
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600"
        />
      </form>
    </Modal>
  );
}
