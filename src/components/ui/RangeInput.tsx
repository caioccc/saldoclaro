"use client";

import type { CSSProperties } from "react";

const TONES = {
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  zinc: "#a1a1aa",
} as const;

interface RangeInputProps {
  id?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  tone?: keyof typeof TONES;
  disabled?: boolean;
  ariaLabel?: string;
}

export function RangeInput({
  id,
  value,
  min,
  max,
  step = 1,
  onChange,
  tone = "emerald",
  disabled = false,
  ariaLabel,
}: RangeInputProps) {
  const safeRange = max - min || 1;
  const percent = Math.min(100, Math.max(0, ((value - min) / safeRange) * 100));
  const style = {
    "--range-progress": `${percent}%`,
    "--range-color": TONES[tone],
  } as CSSProperties;

  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => onChange(Number(event.target.value))}
      style={style}
      className="range-input w-full disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}
