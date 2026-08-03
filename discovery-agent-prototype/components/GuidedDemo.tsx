"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { BillDetails } from "@/components/BillDetails";
import { CartFooter } from "@/components/CartFooter";
import { CartItemRow } from "@/components/CartItemRow";
import { CouponsRow } from "@/components/CouponsRow";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart } from "@/lib/cart-context";
import { useDemoToast } from "@/lib/demo-toast";
import {
  markDiscoveryAdded,
  resetDiscoverySessionFlags,
} from "@/lib/discovery-session";
import { getThesisDemoCartIds } from "@/lib/catalog";
import { getProduct } from "@/lib/products";
import { useUrgency } from "@/lib/urgency-context";

type BeatId = "a" | "b" | "c";

type Beat = {
  id: BeatId;
  title: string;
  detail: string;
};

const BEATS: Beat[] = [
  {
    id: "a",
    title: "Beat A — Thesis cart",
    detail: "Snacks + drink load → hosting mission inferred",
  },
  {
    id: "b",
    title: "Beat B — One card",
    detail: "Single suggestion + Why this? · Show another · Not now",
  },
  {
    id: "c",
    title: "Beat C — Add",
    detail: "Add the pick → card hides for the session → Proceed",
  },
];

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function GuidedDemo() {
  const { setLevelPreset } = useUrgency();
  const {
    lines,
    setQty,
    addProduct,
    replaceCart,
    itemCount,
    subtotal,
    flashProductId,
  } = useCart();
  const { showToast } = useDemoToast();
  const [activeBeat, setActiveBeat] = useState<BeatId | null>(null);
  const [done, setDone] = useState<Partial<Record<BeatId, boolean>>>({});
  const [playing, setPlaying] = useState(false);
  const [narration, setNarration] = useState(
    "Press Play demo for a 3-beat walkthrough of checkout.",
  );
  const runId = useRef(0);

  const playDemo = useCallback(async () => {
    const id = ++runId.current;
    setPlaying(true);
    setDone({});
    resetDiscoverySessionFlags();
    replaceCart(getThesisDemoCartIds());

    setActiveBeat("a");
    setLevelPreset("high");
    setNarration(
      "Beat A: Thesis cart — chips, namkeen, soft drink → hosting mission.",
    );
    await sleep(2200);
    if (runId.current !== id) return;
    setDone((d) => ({ ...d, a: true }));

    setActiveBeat("b");
    resetDiscoverySessionFlags();
    replaceCart(getThesisDemoCartIds());
    setNarration(
      "Beat B: One card — Paper Plates from Kitchenware (new category) + Why this?",
    );
    await sleep(2800);
    if (runId.current !== id) return;
    setDone((d) => ({ ...d, b: true }));

    setActiveBeat("c");
    setNarration(
      "Beat C: Adding the pick — card hides for this session, then Proceed.",
    );
    await sleep(900);
    if (runId.current !== id) return;
    addProduct("paper-plates");
    markDiscoveryAdded();
    window.dispatchEvent(new Event("da-session-change"));
    showToast("Added to cart");
    await sleep(1400);
    if (runId.current !== id) return;
    showToast("Proceed success — demo order captured (visual only)");
    setDone((d) => ({ ...d, c: true }));

    resetDiscoverySessionFlags();
    replaceCart(getThesisDemoCartIds());
    setLevelPreset("high");
    setNarration(
      "Demo complete. Open /cart — one Discovery card, once per session.",
    );
    setPlaying(false);
    setActiveBeat(null);
  }, [addProduct, replaceCart, setLevelPreset, showToast]);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="border-b border-blinkit-border bg-[linear-gradient(180deg,#F8C301_0%,#FFF8D6_55%,#FFFFFF_100%)] px-4 pb-4 pt-3">
        <h1 className="text-xl font-extrabold text-blinkit-charcoal">
          Discovery Agent — guided demo
        </h1>
        <p className="mt-1 text-sm text-blinkit-charcoal/85">
          One checkout card · novel category · once per session. No chatbot.
        </p>

        <button
          type="button"
          onClick={() => void playDemo()}
          disabled={playing}
          className="mt-4 w-full rounded-2xl bg-blinkit-charcoal px-4 py-4 text-base font-extrabold text-white shadow-md transition-opacity disabled:opacity-60"
        >
          {playing ? "Playing demo…" : "Play demo"}
        </button>

        <p className="mt-2 text-center text-xs text-blinkit-charcoal/75">
          Or{" "}
          <Link
            href="/cart"
            className="font-semibold underline underline-offset-2"
          >
            open cart
          </Link>
          {" · "}
          <Link href="/" className="font-semibold underline underline-offset-2">
            home
          </Link>
        </p>
      </header>

      <div className="px-4 pt-4">
        <p
          className="rounded-xl border border-blinkit-border bg-blinkit-soft-gray px-3 py-2 text-xs leading-relaxed text-blinkit-charcoal"
          aria-live="polite"
        >
          {narration}
        </p>

        <ol className="mt-3 space-y-2">
          {BEATS.map((beat) => {
            const isActive = activeBeat === beat.id;
            const isDone = Boolean(done[beat.id]);
            return (
              <li
                key={beat.id}
                className={`rounded-xl border px-3 py-2.5 ${
                  isActive
                    ? "border-blinkit-charcoal bg-[#FFF8D6]"
                    : isDone
                      ? "border-blinkit-green/40 bg-[#E8F8EE]"
                      : "border-blinkit-border bg-white"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isDone
                        ? "bg-blinkit-green text-white"
                        : isActive
                          ? "bg-blinkit-charcoal text-white"
                          : "bg-blinkit-soft-gray text-blinkit-secondary ring-1 ring-blinkit-border"
                    }`}
                    aria-hidden
                  >
                    {isDone ? "✓" : beat.id.toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-blinkit-charcoal">
                      {beat.title}
                    </p>
                    <p className="text-[11px] text-blinkit-secondary">
                      {beat.detail}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-md bg-[#E8F8EE] px-2 py-1 font-semibold text-blinkit-green ring-1 ring-blinkit-green/30">
            {itemCount > 0
              ? "Suggestions ready on checkout"
              : "Add items to see picks"}
          </span>
        </div>
      </div>

      <div className="mt-4 border-t border-blinkit-border px-4 pt-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blinkit-muted">
          Checkout
        </p>

        <div className="mb-2 flex items-center gap-2 rounded-xl bg-[#E8F8EE] px-3 py-2">
          <span className="text-sm font-bold text-blinkit-charcoal">
            Delivery in 9 minutes
          </span>
          <span className="text-[11px] text-blinkit-secondary">
            · Gurugram · Home
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-blinkit-border bg-white px-3">
          {lines.map((line) => {
            const product = getProduct(line.productId);
            if (!product) return null;
            return (
              <CartItemRow
                key={line.productId}
                product={product}
                qty={line.qty}
                onQtyChange={(qty) => setQty(line.productId, qty)}
                highlight={flashProductId === line.productId}
              />
            );
          })}
        </div>

        <div className="mt-3">
          <DiscoveryCard />
        </div>

        {itemCount > 0 && (
          <div className="mt-3 space-y-3">
            <CouponsRow />
            <BillDetails itemTotal={subtotal} />
          </div>
        )}
      </div>

      <CartFooter variant="checkout" />
      <SiteFooter />
    </div>
  );
}
