"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  computeUrgencyIntent,
  URGENCY_PRESETS,
  type UrgencyFeatures,
  type UrgencyLevel,
  type UrgencyResult,
} from "@/lib/urgency";

type UrgencyContextValue = {
  level: UrgencyLevel;
  features: UrgencyFeatures;
  result: UrgencyResult;
  setLevelPreset: (level: UrgencyLevel) => void;
  setFeatures: (
    next: UrgencyFeatures | ((prev: UrgencyFeatures) => UrgencyFeatures),
  ) => void;
};

const UrgencyContext = createContext<UrgencyContextValue | null>(null);

export function UrgencyProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useState<UrgencyLevel>("high");
  const [features, setFeatures] = useState<UrgencyFeatures>(
    URGENCY_PRESETS.high,
  );

  const result = useMemo(() => computeUrgencyIntent(features), [features]);

  const setLevelPreset = useCallback((next: UrgencyLevel) => {
    setLevel(next);
    setFeatures(URGENCY_PRESETS[next]);
  }, []);

  const value = useMemo(
    () => ({ level, features, result, setLevelPreset, setFeatures }),
    [level, features, result, setLevelPreset],
  );

  return (
    <UrgencyContext.Provider value={value}>{children}</UrgencyContext.Provider>
  );
}

export function useUrgency() {
  const ctx = useContext(UrgencyContext);
  if (!ctx) throw new Error("useUrgency must be used within UrgencyProvider");
  return ctx;
}
