"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { computeBill } from "@/lib/bill";
import { useCart } from "@/lib/cart-context";
import { useDemoToast } from "@/lib/demo-toast";
import { formatINR } from "@/lib/products";

type CartFooterProps = {
  variant?: "nav" | "checkout";
};

export function CartFooter({ variant = "nav" }: CartFooterProps) {
  const { itemCount, subtotal } = useCart();
  const pathname = usePathname();
  const { showToast } = useDemoToast();

  if (itemCount === 0) return null;

  const isCheckout =
    variant === "checkout" || pathname === "/cart" || pathname === "/demo";
  const displayTotal = isCheckout
    ? computeBill(subtotal).grandTotal
    : subtotal;

  function handleProceed() {
    if (!isCheckout) return;
    showToast("Proceed success — demo order captured (visual only)");
  }

  const proceedClass =
    "flex items-center gap-1.5 rounded-xl bg-blinkit-green px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blinkit-green-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blinkit-charcoal";

  return (
    <div className="sticky bottom-0 z-20 mt-auto border-t border-blinkit-border bg-white px-3 pb-3 pt-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-blinkit-charcoal">
            {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
            {formatINR(displayTotal)}
          </p>
          {isCheckout ? (
            <button
              type="button"
              className="text-xs font-medium text-blinkit-green"
            >
              View detailed bill
            </button>
          ) : (
            <p className="text-xs text-blinkit-muted">
              Breakfast mission basket
            </p>
          )}
        </div>
        {isCheckout ? (
          <button type="button" onClick={handleProceed} className={proceedClass}>
            Proceed
            <span aria-hidden>›</span>
          </button>
        ) : (
          <Link href="/cart" className={proceedClass}>
            Proceed
            <span aria-hidden>›</span>
          </Link>
        )}
      </div>
    </div>
  );
}
