"use client";

import type { ReactNode } from "react";
import { ViewportShell } from "@/components/ViewportShell";
import { CartProvider } from "@/lib/cart-context";
import { DeviceProvider } from "@/lib/device-context";
import { DemoToastProvider } from "@/lib/demo-toast";
import { GeminiFlagProvider } from "@/lib/gemini-flag";
import { SearchProvider } from "@/lib/search-context";
import { UrgencyProvider } from "@/lib/urgency-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <DeviceProvider>
      <GeminiFlagProvider>
        <UrgencyProvider>
          <CartProvider>
            <SearchProvider>
              <DemoToastProvider>
                <ViewportShell>{children}</ViewportShell>
              </DemoToastProvider>
            </SearchProvider>
          </CartProvider>
        </UrgencyProvider>
      </GeminiFlagProvider>
    </DeviceProvider>
  );
}
