"use client";

import type { ReactNode } from "react";
import { DeviceToggle } from "@/components/DeviceToggle";
import { useDevice } from "@/lib/device-context";

function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full items-start justify-center px-3 pb-8 pt-16">
      <div
        className="relative w-full max-w-[390px] overflow-hidden rounded-[2rem] border-[10px] border-blinkit-charcoal bg-white shadow-2xl"
        style={{ height: 844 }}
      >
        <div className="absolute inset-x-0 top-0 z-20 flex h-11 items-end justify-between bg-white px-5 pb-1.5 text-[13px] font-semibold text-blinkit-charcoal">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-[11px] text-blinkit-muted">
            <span aria-hidden>●●●●</span>
            <span aria-hidden>Wi‑Fi</span>
            <span className="rounded-[3px] border border-blinkit-charcoal px-1 text-[10px] text-blinkit-charcoal">
              100
            </span>
          </div>
        </div>

        <div className="no-scrollbar absolute inset-0 flex flex-col overflow-y-auto bg-white pt-11 pb-5">
          {children}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-1 z-20 flex justify-center">
          <div className="h-1 w-28 rounded-full bg-blinkit-charcoal/80" />
        </div>
      </div>
    </div>
  );
}

function DesktopFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-[#f0f0f5] pt-16">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1120px] flex-col bg-white shadow-sm">
        {children}
      </div>
    </div>
  );
}

export function ViewportShell({ children }: { children: ReactNode }) {
  const { isMobile } = useDevice();

  return (
    <>
      <DeviceToggle />
      {isMobile ? (
        <MobileFrame>{children}</MobileFrame>
      ) : (
        <DesktopFrame>{children}</DesktopFrame>
      )}
    </>
  );
}
