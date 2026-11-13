"use client";

import { useEffect, useRef } from "react";
import type { AppState } from "@/types";

export const DATABASE_MIGRATION_KEY = "capacidade-credito:database-migration:v1";

export function useDatabaseSync(app: AppState | null, hydrated: boolean) {
  const skippedMigratedState = useRef(false);

  useEffect(() => {
    if (!hydrated || !app || !process.env.NEXT_PUBLIC_SYNC_SECRET) return;
    if (
      !skippedMigratedState.current &&
      window.localStorage.getItem(DATABASE_MIGRATION_KEY) === "true"
    ) {
      skippedMigratedState.current = true;
      return;
    }

    const controller = new AbortController();

    void fetch("/api/sync-local-data", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-sync-secret": process.env.NEXT_PUBLIC_SYNC_SECRET,
      },
      body: JSON.stringify(app),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const result = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(result?.error ?? "A sincronização com o banco falhou.");
        }

        window.localStorage.setItem(DATABASE_MIGRATION_KEY, "true");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Não foi possível sincronizar os dados locais com o banco.", error);
      });

    return () => controller.abort();
  }, [app, hydrated]);
}
