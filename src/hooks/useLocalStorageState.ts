"use client";

import { useCallback, useSyncExternalStore } from "react";

type Updater<T> = T | ((previous: T) => T);
type Listener = () => void;

interface Options<T> {
  deserialize?: (raw: string) => T | null;
}

interface StoreEntry<T> {
  raw: string | null;
  value: T;
}

const entries = new Map<string, StoreEntry<unknown>>();
const listeners = new Map<string, Set<Listener>>();

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function hydrate<T>(
  key: string,
  createInitial: () => T,
  deserialize?: (raw: string) => T | null,
): T {
  const existing = entries.get(key);
  if (existing) return existing.value as T;

  let value: T;
  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(key);
    const parsed = raw
      ? deserialize
        ? deserialize(raw)
        : (JSON.parse(raw) as T)
      : null;
    value = parsed ?? createInitial();
  } catch {
    value = createInitial();
    raw = null;
  }

  try {
    const serialized = JSON.stringify(value);
    if (serialized !== raw) {
      window.localStorage.setItem(key, serialized);
      raw = serialized;
    }
  } catch {
    // Keep the in-memory value when storage is unavailable.
  }

  entries.set(key, { raw, value: value as unknown });
  return value;
}

function subscribeToStore<T>(
  key: string,
  listener: Listener,
  createInitial: () => T,
  deserialize?: (raw: string) => T | null,
): () => void {
  let keyListeners = listeners.get(key);
  if (!keyListeners) {
    keyListeners = new Set();
    listeners.set(key, keyListeners);
  }
  keyListeners.add(listener);

  if (!entries.has(key)) {
    hydrate(key, createInitial, deserialize);
    notify(key);
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== key) return;

    try {
      const raw = event.newValue;
      if (raw === null) {
        entries.delete(key);
        hydrate(key, createInitial, deserialize);
      } else {
        const parsed = deserialize ? deserialize(raw) : (JSON.parse(raw) as T);
        if (parsed === null) return;
        entries.set(key, { raw, value: parsed });
      }
      notify(key);
    } catch {
      // Ignore malformed updates from other tabs.
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    keyListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
    if (keyListeners.size === 0) listeners.delete(key);
  };
}

function setStoredValue<T>(key: string, updater: Updater<T>) {
  const entry = entries.get(key);
  if (!entry) return;

  const previous = entry.value as T;
  const next = typeof updater === "function" ? (updater as (value: T) => T)(previous) : updater;
  let raw: string | null = entry.raw;

  try {
    raw = JSON.stringify(next);
    window.localStorage.setItem(key, raw);
  } catch {
    // Keep the in-memory value when storage is unavailable.
  }

  entries.set(key, { raw, value: next });
  notify(key);
}

const getServerSnapshot = <T,>(): T | null => null;

export function useLocalStorageState<T>(
  key: string,
  createInitial: () => T,
  options: Options<T> = {},
) {
  const deserialize = options.deserialize;

  const subscribe = useCallback(
    (listener: Listener) => subscribeToStore(key, listener, createInitial, deserialize),
    [createInitial, deserialize, key],
  );

  const getSnapshot = useCallback(
    () => (entries.get(key)?.value as T | undefined) ?? null,
    [key],
  );

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot<T>);
  const setValue = useCallback(
    (updater: Updater<T>) => setStoredValue(key, updater),
    [key],
  );

  return { value, setValue, hydrated: value !== null };
}
