"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "border-emerald-600 bg-emerald-500 dark:border-emerald-400 dark:bg-emerald-500"
          : "border-zinc-300 bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-700"
      }`}
    >
      <span
        className={`pointer-events-none absolute size-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
