"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { DiscoveryWhySheet } from "@/components/DiscoveryWhySheet";
import { ProductThumb } from "@/components/ProductThumb";
import { getDiscoveryPoolsForBasket } from "@/lib/discovery-pool";
import {
  buildDiscoverRequestBase,
  fetchDiscoverRank,
} from "@/lib/discover-client";
import type { DiscoverResponse } from "@/lib/discover-types";
import {
  isDiscoveryBlockedThisSession,
  markDiscoveryAdded,
  markDiscoveryDismissed,
} from "@/lib/discovery-session";
import { useCart } from "@/lib/cart-context";
import { useDemoToast } from "@/lib/demo-toast";
import { useGeminiFlag } from "@/lib/gemini-flag";
import { getProductL0 } from "@/lib/novelty";
import { formatINR, getProduct, type Product } from "@/lib/products";
import { useUrgency } from "@/lib/urgency-context";
import { buildReasoningPack } from "@/lib/discovery-reasoning";

const SESSION_EVENT = "da-session-change";

const L0_LABEL: Record<string, string> = {
  "vegetables-fruits": "Fruits & veg",
  "dairy-bread-eggs": "Dairy",
  "dry-fruits-cereals": "Cereals / dry fruits",
  "chips-namkeen": "Chips & namkeen",
  "sweets-chocolates": "Sweets",
  "bakery-biscuits": "Bakery & biscuits",
  "drinks-juices": "Drinks & juices",
  "kitchenware-appliances": "Kitchenware",
  "health-pharma": "Health & pharma",
  "bath-body": "Bath & body",
  "skin-face": "Skin & face",
  "pet-care": "Pet care",
  "baby-care": "Baby care",
  "paan-corner": "Paan / mints",
  "cleaners-repellents": "Cleaners",
  "home-lifestyle": "Home",
  "tea-coffee": "Tea & coffee",
  "ice-creams": "Ice cream",
  "sauces-spreads": "Sauces",
  "instant-food": "Instant food",
};

function subscribeSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SESSION_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SESSION_EVENT, onChange);
  };
}

function emitSessionChange() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function getBlockedSnapshot() {
  return isDiscoveryBlockedThisSession();
}

function getServerFalse() {
  return false;
}

function logFeedback(
  productId: string,
  action: "accepted" | "show_another" | "not_interested",
) {
  void fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId,
      action,
      ts: new Date().toISOString(),
    }),
  }).catch(() => undefined);
}

function PickTile({
  product,
  badge,
  onAdded,
}: {
  product: Product;
  badge: string;
  onAdded: (productId: string) => void;
}) {
  const { lines, addProduct, setQty } = useCart();
  const { showToast } = useDemoToast();
  const qty = lines.find((l) => l.productId === product.id)?.qty ?? 0;
  const savePct =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  function handleAdd(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addProduct(product.id);
    showToast(`Added ${product.name}`, 1400);
    onAdded(product.id);
  }

  return (
    <article className="relative flex flex-col rounded-xl border border-blinkit-border/80 bg-white p-2 shadow-sm">
      <span className="absolute left-1.5 top-1.5 z-10 max-w-[90%] truncate rounded bg-[#F8C301] px-1 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-blinkit-charcoal">
        {badge}
      </span>
      <Link
        href={`/product/${product.id}`}
        className="mt-4 block"
        aria-label={`View ${product.name}`}
      >
        <ProductThumb
          product={product}
          size="sm"
          className="mx-auto h-[72px] w-[72px] text-2xl"
        />
      </Link>
      <Link
        href={`/product/${product.id}`}
        className="mt-1.5 line-clamp-2 min-h-[2.25rem] text-[11px] font-bold leading-snug text-blinkit-charcoal hover:underline"
      >
        {product.name}
      </Link>
      <p className="mt-0.5 text-[10px] text-blinkit-muted">{product.unit}</p>
      <div className="mt-auto flex items-end justify-between gap-1 pt-2">
        <div>
          <p className="text-xs font-extrabold text-blinkit-charcoal">
            {formatINR(product.price)}
            {product.mrp && product.mrp > product.price && (
              <span className="ml-1 text-[9px] font-medium text-blinkit-muted line-through">
                {formatINR(product.mrp)}
              </span>
            )}
          </p>
          {savePct > 0 && (
            <p className="text-[9px] font-bold text-blinkit-green">
              {savePct}% OFF
            </p>
          )}
        </div>
        {qty === 0 ? (
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-md bg-blinkit-green px-2.5 py-1 text-[10px] font-extrabold text-white hover:bg-blinkit-green-dark"
          >
            ADD
          </button>
        ) : (
          <div className="flex h-7 items-center overflow-hidden rounded-md border border-blinkit-green text-blinkit-green">
            <button
              type="button"
              aria-label={`Decrease ${product.name}`}
              onClick={() => setQty(product.id, qty - 1)}
              className="flex h-full w-6 items-center justify-center text-xs font-bold"
            >
              −
            </button>
            <span className="min-w-4 text-center text-[10px] font-bold">
              {qty}
            </span>
            <button
              type="button"
              aria-label={`Increase ${product.name}`}
              onClick={() => setQty(product.id, qty + 1)}
              className="flex h-full w-6 items-center justify-center text-xs font-bold"
            >
              +
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * Slide 8: cart card with 2 novel-category picks + Why / Show another / Not now.
 */
export function DiscoveryCard() {
  const { result } = useUrgency();
  const { lines, itemCount } = useCart();
  const { useGeminiRanker } = useGeminiFlag();
  const [whyOpen, setWhyOpen] = useState(false);
  const [rank, setRank] = useState<DiscoverResponse | null>(null);
  /** Page of 2 alternatives */
  const [page, setPage] = useState(0);
  const fetchGen = useRef(0);

  const blocked = useSyncExternalStore(
    subscribeSession,
    getBlockedSnapshot,
    getServerFalse,
  );

  const cartIds = useMemo(
    () => new Set(lines.map((l) => l.productId)),
    [lines],
  );

  const pools = useMemo(
    () => getDiscoveryPoolsForBasket(lines.map((l) => l.productId)),
    [lines],
  );

  const eligible = !blocked && itemCount > 0 && !pools.suppress;

  const basketKey = lines.map((l) => `${l.productId}:${l.qty}`).join("|");

  useEffect(() => {
    if (!eligible) return;

    const gen = ++fetchGen.current;
    let cancelled = false;
    setPage(0);

    void (async () => {
      const basket = lines.map((l) => {
        const p = getProduct(l.productId);
        return {
          productId: l.productId,
          name: p?.name ?? l.productId,
          qty: l.qty,
        };
      });

      const data = await fetchDiscoverRank(
        buildDiscoverRequestBase({
          basket,
          urgency: { score: result.score, reasons: result.reasons },
          useGemini: useGeminiRanker,
          excludeIds: [],
        }),
      );

      if (cancelled || gen !== fetchGen.current) return;
      setRank(data);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible, basketKey, result.score, useGeminiRanker]);

  const alternatives = useMemo(() => {
    const fromRank = (rank?.completion_ids ?? []).filter(
      (id) => !cartIds.has(id),
    );
    const pool =
      fromRank.length > 0
        ? fromRank
        : pools.completionIds.filter((id) => !cartIds.has(id));
    // Prefer ids whose L0 is not already in the cart (CER)
    const cartL0 = new Set(pools.inference.cart_l0s);
    const cross = pool.filter((id) => {
      const l0 = getProductL0(id);
      return l0 && !cartL0.has(l0);
    });
    const ordered =
      pools.inference.mode === "same_aisle"
        ? pool
        : cross.length > 0
          ? cross
          : pool;
    // Exactly up to 6 for 3 pages × 2
    return ordered.slice(0, 6);
  }, [rank, cartIds, pools.completionIds, pools.inference]);

  const pageSize = 2;
  const totalPages = Math.max(1, Math.ceil(alternatives.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const visibleIds = alternatives.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
  );
  const canGoNext = safePage < totalPages - 1;
  const canGoBack = safePage > 0;

  const handleAdded = useCallback((productId: string) => {
    markDiscoveryAdded();
    emitSessionChange();
    logFeedback(productId, "accepted");
  }, []);

  const goNext = useCallback(() => {
    if (!canGoNext) return;
    const current = visibleIds[0];
    if (current) logFeedback(current, "show_another");
    setPage((p) => Math.min(p + 1, totalPages - 1));
    setWhyOpen(false);
  }, [canGoNext, visibleIds, totalPages]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    setPage((p) => Math.max(p - 1, 0));
    setWhyOpen(false);
  }, [canGoBack]);

  const handleNotNow = useCallback(() => {
    if (visibleIds[0]) logFeedback(visibleIds[0], "not_interested");
    markDiscoveryDismissed();
    emitSessionChange();
  }, [visibleIds]);

  if (!eligible || visibleIds.length === 0) return null;

  const primary = getProduct(visibleIds[0]!);
  if (!primary) return null;

  const sameAisle = pools.inference.mode === "same_aisle";
  const subtitle = sameAisle
    ? "Matching picks from this aisle"
    : "New categories that finish this trip";

  const reasoning = buildReasoningPack({
    cartProductIds: lines.map((l) => l.productId),
    inference: pools.inference,
    pickIds: visibleIds,
  });

  return (
    <>
      <section
        aria-label="Suggested for this trip"
        className="discovery-card-enter overflow-hidden rounded-2xl border border-[#E8D48A] bg-[linear-gradient(145deg,#FFF9E0_0%,#FFFFFF_48%,#F3FBF5_100%)] shadow-[0_2px_10px_rgba(248,195,1,0.12)]"
      >
        <div className="flex items-start justify-between gap-2 border-b border-[#F0E4B0]/bg-[#FFF4C2]/60 px-3.5 py-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#F8C301]"
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="#0C831F">
                  <path d="M13.2 3.2 6.4 13.4h4.3l-1.1 7.4 8.2-11.8h-4.5L13.2 3.2Z" />
                </svg>
              </span>
              <h3 className="text-sm font-extrabold text-blinkit-charcoal">
                Based on your cart
              </h3>
            </div>
            <p className="mt-0.5 text-[11px] font-medium leading-snug text-blinkit-secondary">
              {subtitle}
              {alternatives.length > 2
                ? ` · ${alternatives.length} ideas`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWhyOpen(true)}
            className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-blinkit-green shadow-sm ring-1 ring-blinkit-green/25 hover:bg-[#E8F8EE]"
          >
            Why this?
          </button>
        </div>

        <div
          className={`grid gap-2 px-3.5 py-3 ${
            visibleIds.length > 1 ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          {visibleIds.map((id) => {
            const product = getProduct(id);
            if (!product) return null;
            const l0 = getProductL0(id);
            const badge = sameAisle
              ? "Pairs with cart"
              : `New: ${L0_LABEL[l0 ?? ""] ?? "for you"}`;
            return (
              <PickTile
                key={id}
                product={product}
                badge={badge}
                onAdded={handleAdded}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-[#F0E4B0]/80 bg-white/70 px-3 py-2">
          <button
            type="button"
            onClick={goBack}
            disabled={!canGoBack}
            aria-label="Previous recommendations"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blinkit-border bg-white text-sm font-bold text-blinkit-charcoal disabled:cursor-not-allowed disabled:opacity-30"
          >
            ‹
          </button>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex items-center gap-1.5" aria-hidden>
              {Array.from({ length: totalPages }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === safePage
                      ? "w-4 bg-blinkit-green"
                      : "w-1.5 bg-blinkit-border"
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] font-medium text-blinkit-muted">
              {safePage + 1} / {totalPages}
            </p>
            {canGoNext ? (
              <button
                type="button"
                onClick={goNext}
                className="text-[11px] font-bold text-blinkit-green hover:underline"
              >
                Show more
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNotNow}
                className="text-[11px] font-medium text-blinkit-muted hover:text-blinkit-secondary"
              >
                Not now
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext}
            aria-label="Next recommendations"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blinkit-border bg-white text-sm font-bold text-blinkit-charcoal disabled:cursor-not-allowed disabled:opacity-30"
          >
            ›
          </button>
        </div>

        {canGoNext && (
          <div className="border-t border-[#F0E4B0]/50 px-3.5 py-1.5 text-center">
            <button
              type="button"
              onClick={handleNotNow}
              className="text-[10px] font-medium text-blinkit-muted hover:text-blinkit-secondary"
            >
              Not now
            </button>
          </div>
        )}
      </section>

      <DiscoveryWhySheet
        open={whyOpen}
        onClose={() => setWhyOpen(false)}
        customerHeadline={reasoning.customerHeadline}
        bodyLines={reasoning.customerLines}
        productName={primary.name}
        rating={primary.rating}
        ratingCount={primary.ratingCount}
        returnWindow={primary.returnWindow}
        novelCategoryLabel={
          sameAisle
            ? undefined
            : L0_LABEL[getProductL0(primary.id) ?? ""] ??
              pools.neverPurchasedLabels[0]
        }
        pmReasoning={reasoning.pmReasoning}
      />
    </>
  );
}
