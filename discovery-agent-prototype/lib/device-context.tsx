"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type DeviceMode = "mobile" | "desktop";

type DeviceContextValue = {
  mode: DeviceMode;
  setMode: (mode: DeviceMode) => void;
  isMobile: boolean;
};

const DeviceContext = createContext<DeviceContextValue | null>(null);

const STORAGE_KEY = "discovery-agent-device";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("discovery-device-change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("discovery-device-change", onStoreChange);
  };
}

function getSnapshot(): DeviceMode {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "desktop" ? "desktop" : "mobile";
}

function getServerSnapshot(): DeviceMode {
  return "mobile";
}

export function DeviceProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setMode = useCallback((next: DeviceMode) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event("discovery-device-change"));
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, isMobile: mode === "mobile" }),
    [mode, setMode],
  );

  return (
    <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
  );
}

export function useDevice() {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error("useDevice must be used within DeviceProvider");
  return ctx;
}
