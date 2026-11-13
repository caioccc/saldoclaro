"use client";

import { useEffect, useRef, useState } from "react";
import type { AppState, Simulation } from "@/types";
import { parseAppState } from "@/lib/storage";

type SetAppState = (updater: AppState | ((previous: AppState) => AppState)) => void;

function isEmptyDefaultSimulation(simulation: Simulation): boolean {
  return (
    simulation.name === "Minha simulação" &&
    Object.keys(simulation.budgets).length === 0 &&
    simulation.debts.length === 0
  );
}

function mergeAppStates(local: AppState, remote: AppState): AppState {
  const localIsPlaceholder =
    local.simulations.length === 1 && isEmptyDefaultSimulation(local.simulations[0]);
  const simulations = new Map(remote.simulations.map((simulation) => [simulation.id, simulation]));

  if (!localIsPlaceholder) {
    for (const simulation of local.simulations) {
      simulations.set(simulation.id, simulation);
    }
  }

  const mergedSimulations = Array.from(simulations.values());
  const activeSimulationId = mergedSimulations.some(
    (simulation) => simulation.id === local.activeSimulationId,
  )
    ? local.activeSimulationId
    : mergedSimulations[0]?.id ?? "";

  return {
    version: 1,
    simulations: mergedSimulations,
    activeSimulationId,
    fees: local.fees,
  };
}

export function useDatabaseSync(
  app: AppState | null,
  hydrated: boolean,
  setValue: SetAppState,
) {
  const initialized = useRef(false);
  const [databaseReady, setDatabaseReady] = useState(false);

  useEffect(() => {
    if (!hydrated || !app || initialized.current) return;
    initialized.current = true;
    const controller = new AbortController();

    void fetch("/api/sync-local-data", { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.reload();
          return;
        }
        if (!response.ok) throw new Error("Não foi possível carregar os dados do banco.");

        const remote = parseAppState(await response.json());
        if (remote) {
          const merged = mergeAppStates(app, remote);
          setDatabaseReady(true);
          if (JSON.stringify(merged) !== JSON.stringify(app)) {
            setValue(merged);
          }
        } else {
          setDatabaseReady(true);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Não foi possível carregar os dados do banco.", error);
        setDatabaseReady(true);
      });

    return () => controller.abort();
  }, [app, hydrated, setValue]);

  useEffect(() => {
    if (!databaseReady || !app) return;
    const controller = new AbortController();

    void fetch("/api/sync-local-data", {
      method: "POST",
      headers: { "content-type": "application/json" },
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
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Não foi possível sincronizar os dados com o banco.", error);
      });

    return () => controller.abort();
  }, [app, databaseReady]);
}
