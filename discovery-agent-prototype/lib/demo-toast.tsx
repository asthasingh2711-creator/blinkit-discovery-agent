"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DemoToastContextValue = {
  message: string | null;
  showToast: (message: string, ms?: number) => void;
};

const DemoToastContext = createContext<DemoToastContextValue | null>(null);

export function DemoToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((next: string, ms = 2400) => {
    setMessage(next);
    window.setTimeout(() => setMessage(null), ms);
  }, []);

  const value = useMemo(
    () => ({ message, showToast }),
    [message, showToast],
  );

  return (
    <DemoToastContext.Provider value={value}>
      {children}
      {message && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-28 left-1/2 z-[90] max-w-[min(90vw,320px)] -translate-x-1/2 rounded-full bg-blinkit-charcoal px-4 py-2.5 text-center text-xs font-medium text-white shadow-lg"
        >
          {message}
        </div>
      )}
    </DemoToastContext.Provider>
  );
}

export function useDemoToast() {
  const ctx = useContext(DemoToastContext);
  if (!ctx) throw new Error("useDemoToast must be used within DemoToastProvider");
  return ctx;
}
