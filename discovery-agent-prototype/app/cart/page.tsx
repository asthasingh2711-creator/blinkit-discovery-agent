"use client";

import Link from "next/link";
import { BillDetails } from "@/components/BillDetails";
import { CartFooter } from "@/components/CartFooter";
import { CartItemRow } from "@/components/CartItemRow";
import { CouponsRow } from "@/components/CouponsRow";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart } from "@/lib/cart-context";
import { useDevice } from "@/lib/device-context";
import { getProduct } from "@/lib/products";

const DELIVERY_ETA_MINUTES = 9;

export default function CartPage() {
  const { lines, setQty, itemCount, subtotal, flashProductId } = useCart();
  const { isMobile } = useDevice();

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-blinkit-border bg-white px-4 py-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-blinkit-soft-gray"
          aria-label="Back to home"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 6l-6 6 6 6"
              stroke="#1F1F1F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-extrabold text-blinkit-charcoal">
            Checkout
          </h1>
          <p className="text-xs text-blinkit-secondary">Gurugram · Home</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/demo"
            className="text-xs font-bold text-blinkit-charcoal underline-offset-2 hover:underline"
          >
            Guided demo
          </Link>
          {!isMobile && (
            <Link href="/" className="text-sm font-semibold text-blinkit-green">
              Continue shopping
            </Link>
          )}
        </div>
      </header>

      <main
        className={`flex-1 ${isMobile ? "px-4 pb-4" : "mx-auto w-full max-w-2xl px-6 pb-6"}`}
      >
        <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-[#E8F8EE] px-3 py-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm shadow-sm"
            aria-hidden
          >
            ⚡
          </span>
          <div>
            <p className="text-sm font-bold text-blinkit-charcoal">
              Delivery in {DELIVERY_ETA_MINUTES} minutes
            </p>
            <p className="text-[11px] text-blinkit-secondary">
              Shipment of {itemCount}{" "}
              {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        <section className="pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-blinkit-charcoal">
              Review items
            </h2>
            {itemCount > 0 && (
              <span className="text-xs font-medium text-blinkit-muted">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            )}
          </div>

          {lines.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-blinkit-border bg-blinkit-soft-gray px-4 py-10 text-center">
              <p className="text-sm font-semibold text-blinkit-charcoal">
                Your cart is empty
              </p>
              <Link
                href="/"
                className="mt-3 inline-block text-sm font-semibold text-blinkit-green"
              >
                Browse products
              </Link>
            </div>
          ) : (
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
          )}
        </section>

        {/* Slide 8: one suggestion + Why, once/session */}
        {itemCount > 0 && (
          <div className="mt-4">
            <DiscoveryCard />
          </div>
        )}

        {itemCount > 0 && (
          <div className="mt-3 space-y-3">
            <CouponsRow />
            <BillDetails itemTotal={subtotal} />
          </div>
        )}

        <SiteFooter />
      </main>

      <CartFooter variant="checkout" />
    </div>
  );
}
