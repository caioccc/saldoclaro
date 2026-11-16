"use client";

import { Moon, Sun } from "lucide-react";
import { THEME_COOKIE_NAME } from "@/lib/storage";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    document.cookie = `${THEME_COOKIE_NAME}=${isDark ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Alternar entre tema claro e escuro"
      className={`group flex items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white ${
        compact ? "size-10 justify-center" : "w-full gap-2.5 px-3 py-2.5 text-sm font-medium"
      }`}
    >
      <span className="relative grid size-4 shrink-0 place-items-center">
        <Sun className="absolute size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </span>
      {compact ? null : <span>Tema claro / escuro</span>}
    </button>
  );
}
