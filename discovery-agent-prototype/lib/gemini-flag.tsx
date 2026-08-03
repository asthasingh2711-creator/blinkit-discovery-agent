"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "da-use-gemini-ranker";
const EVENT = "da-gemini-flag-change";

type GeminiFlagContextValue = {
  useGeminiRanker: boolean;
  setUseGeminiRanker: (on: boolean) => void;
};

const GeminiFlagContext = createContext<GeminiFlagContextValue | null>(null);

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** Default ON — only explicit "0" disables AI ranker. */
function getSnapshot(): boolean {
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === null) return true;
  return v === "1";
}

function getServerSnapshot(): boolean {
  return true;
}

export function GeminiFlagProvider({ children }: { children: ReactNode }) {
  const useGeminiRanker = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setUseGeminiRanker = useCallback((on: boolean) => {
    window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const value = useMemo(
    () => ({ useGeminiRanker, setUseGeminiRanker }),
    [useGeminiRanker, setUseGeminiRanker],
  );

  return (
    <GeminiFlagContext.Provider value={value}>
      {children}
    </GeminiFlagContext.Provider>
  );
}

export function useGeminiFlag() {
  const ctx = useContext(GeminiFlagContext);
  if (!ctx) throw new Error("useGeminiFlag must be used within GeminiFlagProvider");
  return ctx;
}
