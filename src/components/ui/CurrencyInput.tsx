"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { clamp } from "@/utils/finance";
import { formatDecimal, parseLocaleNumber } from "@/utils/format";

interface CurrencyInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function CurrencyInput({
  id,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  placeholder = "0,00",
  disabled = false,
  className = "",
  ariaLabel,
}: CurrencyInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    if (draft === null) return;
    const parsed = clamp(parseLocaleNumber(draft), min, max);
    onChange(Math.round(parsed * 100) / 100);
    setDraft(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-zinc-400 dark:text-zinc-500">
        R$
      </span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        disabled={disabled}
        aria-label={ariaLabel}
        value={draft ?? formatDecimal(value)}
        placeholder={placeholder}
        onFocus={(event) => {
          setDraft(value === 0 ? "" : formatDecimal(value));
          requestAnimationFrame(() => {
            event.target.select();
          });
        }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-right text-sm font-semibold text-zinc-950 tabular-nums shadow-sm outline-none transition placeholder:font-normal placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-emerald-400"
      />
    </div>
  );
}
