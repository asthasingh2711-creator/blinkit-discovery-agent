"use client";

import { ProductThumb } from "@/components/ProductThumb";
import { formatINR, type Product } from "@/lib/products";

type CartItemRowProps = {
  product: Product;
  qty: number;
  onQtyChange: (qty: number) => void;
  highlight?: boolean;
};

export function CartItemRow({
  product,
  qty,
  onQtyChange,
  highlight = false,
}: CartItemRowProps) {
  const linePrice = product.price * qty;
  const lineMrp = product.mrp ? product.mrp * qty : undefined;
  const showStrike = lineMrp !== undefined && lineMrp > linePrice;

  return (
    <div
      className={`flex items-start gap-3 border-b border-blinkit-border/70 py-3.5 last:border-b-0 transition-colors duration-500 ${
        highlight ? "animate-cart-flash bg-[#E8F8EE]" : "bg-transparent"
      }`}
    >
      <ProductThumb product={product} size="sm" className="mt-0.5 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-blinkit-charcoal">
          {product.name}
        </p>
        <p className="mt-0.5 text-xs text-blinkit-muted">{product.unit}</p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-blinkit-charcoal">
            {formatINR(linePrice)}
          </span>
          {showStrike && (
            <span className="text-xs text-blinkit-muted line-through">
              {formatINR(lineMrp!)}
            </span>
          )}
        </div>
      </div>

      <div className="flex h-8 shrink-0 items-center overflow-hidden rounded-lg border border-blinkit-green bg-white text-blinkit-green">
        <button
          type="button"
          aria-label={`Decrease ${product.name}`}
          onClick={() => onQtyChange(qty - 1)}
          className="flex h-full w-8 items-center justify-center text-base font-bold hover:bg-blinkit-green/5"
        >
          −
        </button>
        <span className="min-w-6 text-center text-sm font-bold">{qty}</span>
        <button
          type="button"
          aria-label={`Increase ${product.name}`}
          onClick={() => onQtyChange(qty + 1)}
          className="flex h-full w-8 items-center justify-center text-base font-bold hover:bg-blinkit-green/5"
        >
          +
        </button>
      </div>
    </div>
  );
}
