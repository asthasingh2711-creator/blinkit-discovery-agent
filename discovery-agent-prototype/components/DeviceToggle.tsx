"use client";

import { useDevice, type DeviceMode } from "@/lib/device-context";

export function DeviceToggle() {
  const { mode, setMode } = useDevice();

  const options: { id: DeviceMode; label: string }[] = [
    { id: "mobile", label: "Mobile" },
    { id: "desktop", label: "Desktop" },
  ];

  return (
    <div className="fixed top-3 left-1/2 z-[100] -translate-x-1/2">
      <div
        className="flex items-center gap-0.5 rounded-full border border-black/10 bg-white/95 p-1 shadow-md backdrop-blur-sm"
        role="group"
        aria-label="Device mode"
      >
        {options.map((opt) => {
          const active = mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMode(opt.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-blinkit-charcoal text-white"
                  : "text-blinkit-secondary hover:bg-blinkit-soft-gray"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
