"use client";

import { useEffect, useRef, useState } from "react";
import type { AppState, Simulation } from "@/types";
import { parseAppState, STORAGE_KEY } from "@/lib/storage";

type SetAppState = (updater: AppState | ((previous: AppState) => AppState)) => void;

function isEmptyDefaultSimulation(simulation: Simulation): boolean {
  return (
    simulation.name === "Minha simulação" &&
    Object.keys(simulation.budgets).length === 0 &&
    simulation.debts.length === 0
  );
}

function hasLegacyData(app: AppState): boolean {
  return !(app.simulations.length === 1 && isEmptyDefaultSimulation(app.simulations[0]));
}

function mergeLegacyWithRemote(local: AppState, remote: AppState): AppState {
  const simulations = new Map(remote.simulations.map((simulation) => [simulation.id, simulation]));
  for (const simulation of local.simulations) {
    simulations.set(simulation.id, simulation);
  }

  return {
    version: 1,
    simulations: Array.from(simulations.values()),
    activeSimulationId: local.activeSimulationId || remote.activeSimulationId,
    fees: local.fees,
  };
}

async function requestDatabase(
  method: "GET" | "POST",
  body?: AppState,
  signal?: AbortSignal,
): Promise<AppState | null> {
  const response = await fetch("/api/sync-local-data", {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (response.status === 401) {
    window.location.reload();
    return null;
  }
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? "Não foi possível acessar o banco de dados.");
  }

  if (method === "GET") {
    const raw = (await response.json()) as Record<string, unknown>;
    if (Array.isArray(raw.simulations) && raw.simulations.length === 0) {
      return {
        version: 1,
        simulations: [],
        activeSimulationId: "",
        fees: parseAppState({ fees: raw.fees })?.fees ?? {},
      };
    }
    return parseAppState(raw);
  }
  return null;
}

export function useDatabaseSync(
  app: AppState | null,
  hydrated: boolean,
  setValue: SetAppState,
) {
  const initialized = useRef(false);
  const migrationPayload = useRef<AppState | null>(null);
  const lastPersistedSignature = useRef<string | null>(null);
  const [databaseReady, setDatabaseReady] = useState(false);

  useEffect(() => {
    if (!hydrated || !app || initialized.current) return;
    initialized.current = true;
    const controller = new AbortController();

    void requestDatabase("GET", undefined, controller.signal)
      .then((remote) => {
        if (!remote) return;

        if (hasLegacyData(app)) {
          migrationPayload.current = mergeLegacyWithRemote(app, remote);
          setDatabaseReady(true);
          setValue(migrationPayload.current);
          return;
        }

        lastPersistedSignature.current = JSON.stringify(remote);
        setDatabaseReady(true);
        setValue(remote);
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

    const payload = migrationPayload.current ?? app;
    const signature = JSON.stringify(payload);
    if (!migrationPayload.current && signature === lastPersistedSignature.current) return;

    const controller = new AbortController();
    void requestDatabase("POST", payload, controller.signal)
      .then(() => {
        lastPersistedSignature.current = signature;
        if (migrationPayload.current) {
          migrationPayload.current = null;
          window.localStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Não foi possível salvar os dados no banco.", error);
      });

    return () => controller.abort();
  }, [app, databaseReady]);
}
