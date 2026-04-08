"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

interface CompareContextValue {
  compareIds: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  isInCompare: (id: string) => boolean;
  maxReached: boolean;
}

const CompareContext = createContext<CompareContextValue | undefined>(undefined);
const STORAGE_KEY = "techkart_compare_ids";
const EMPTY_IDS: string[] = [];
let cachedRaw: string | null = null;
let cachedParsed: string[] = EMPTY_IDS;

function getSnapshot(): string[] {
  if (typeof window === "undefined") {
    return EMPTY_IDS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? "[]";
    if (raw === cachedRaw) {
      return cachedParsed;
    }
    const parsed = JSON.parse(raw);
    cachedRaw = raw;
    cachedParsed = Array.isArray(parsed) ? (parsed as string[]) : EMPTY_IDS;
    return cachedParsed;
  } catch {
    return EMPTY_IDS;
  }
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  };

  const onInternal = () => callback();

  window.addEventListener("storage", onStorage);
  window.addEventListener("techkart-compare-change", onInternal);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("techkart-compare-change", onInternal);
  };
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const compareIds = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_IDS);

  const writeCompare = (next: string[]) => {
    const raw = JSON.stringify(next);
    cachedRaw = raw;
    cachedParsed = next;
    localStorage.setItem(STORAGE_KEY, raw);
    window.dispatchEvent(new Event("techkart-compare-change"));
  };

  const value = useMemo(
    () => ({
      compareIds,
      toggleCompare: (id: string) => {
        const prev = getSnapshot();
        if (prev.includes(id)) {
          writeCompare(prev.filter((item) => item !== id));
          return;
        }

        if (prev.length >= 4) {
          return;
        }

        writeCompare([...prev, id]);
      },
      clearCompare: () => writeCompare([]),
      isInCompare: (id: string) => compareIds.includes(id),
      maxReached: compareIds.length >= 4,
    }),
    [compareIds],
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare must be used within CompareProvider");
  }

  return ctx;
}
