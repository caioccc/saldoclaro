"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppState } from "@/types";
import {
  createDefaultAppState,
  normalizeFeeTable,
  parseAppState,
} from "@/lib/storage";

type SetAppState = (updater: AppState | ((previous: AppState) => AppState)) => void;

async function loadAppState(signal?: AbortSignal): Promise<AppState | null> {
  const response = await fetch("/api/app-state", {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (response.status === 401) {
    window.location.reload();
    return null;
  }
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? "Não foi possível carregar os dados do banco.");
  }

  const raw = (await response.json()) as Record<string, unknown>;
  if (Array.isArray(raw.simulations) && raw.simulations.length === 0) {
    return {
      version: 1,
      simulations: [],
      activeSimulationId: "",
      fees: normalizeFeeTable(raw.fees),
    };
  }

  const parsed = parseAppState(raw);
  if (!parsed) throw new Error("Resposta inválida do banco de dados.");
  return parsed;
}

async function saveAppState(app: AppState): Promise<void> {
  const response = await fetch("/api/app-state", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(app),
  });

  if (response.status === 401) {
    window.location.reload();
    return;
  }
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? "Não foi possível salvar os dados no banco.");
  }
}

export function useDatabaseState() {
  const [app, setAppState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [persistedSignature, setPersistedSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ready = useRef(false);
  const mounted = useRef(true);
  const lastPersisted = useRef<string | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    mounted.current = true;
    ready.current = false;
    const controller = new AbortController();

    void loadAppState(controller.signal)
      .then((remote) => {
        if (!remote) return;

        const initial =
          remote.simulations.length === 0
            ? { ...createDefaultAppState(), fees: remote.fees }
            : remote;

        const signature = JSON.stringify(remote);
        lastPersisted.current = signature;
        ready.current = true;
        setPersistedSignature(signature);
        setAppState(initial);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        ready.current = true;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar os dados do banco.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!ready.current || !app) return;

    const signature = JSON.stringify(app);
    if (signature === lastPersisted.current) return;

    queue.current = queue.current
      .catch(() => undefined)
      .then(async () => {
        await saveAppState(app);
        lastPersisted.current = signature;
        if (mounted.current) {
          setPersistedSignature(signature);
          setError(null);
        }
      })
      .catch((saveError: unknown) => {
        if (mounted.current) {
          setError(
            saveError instanceof Error
              ? saveError.message
              : "Não foi possível salvar os dados no banco.",
          );
        }
      });
  }, [app]);

  const setApp = useCallback<SetAppState>((updater) => {
    setAppState((previous) => {
      if (!previous) return previous;
      return typeof updater === "function"
        ? (updater as (value: AppState) => AppState)(previous)
        : updater;
    });
  }, []);

  const saving = app !== null && JSON.stringify(app) !== persistedSignature;

  return {
    app,
    setApp,
    hydrated: app !== null,
    loading,
    saving,
    error,
  };
}
