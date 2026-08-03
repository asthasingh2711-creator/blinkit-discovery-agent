"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { ProductThumb } from "@/components/ProductThumb";
import { useCart } from "@/lib/cart-context";
import { useDemoToast } from "@/lib/demo-toast";
import { formatINR, type Product } from "@/lib/products";

type RailProductCardProps = {
  product: Product;
  badge?: string;
  onAdded?: (productId: string) => void;
};

/** Compact Blinkit-style tile for checkout recommendation grids. */
export function RailProductCard({
  product,
  badge,
  onAdded,
}: RailProductCardProps) {
  const { lines, addProduct, setQty } = useCart();
  const { showToast } = useDemoToast();
  const line = lines.find((l) => l.productId === product.id);
  const qty = line?.qty ?? 0;

  function handleAdd(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addProduct(product.id);
    showToast(`Added ${product.name}`, 1400);
    onAdded?.(product.id);
  }

  return (
    <article className="relative flex flex-col rounded-xl border border-blinkit-border/80 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {badge && (
        <span className="absolute left-1.5 top-1.5 z-10 rounded bg-[#F8C301] px-1 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-blinkit-charcoal">
          {badge}
        </span>
      )}
      <Link
        href={`/product/${product.id}`}
        className="block"
        aria-label={`View ${product.name}`}
      >
        <ProductThumb
          product={product}
          size="sm"
          className="mx-auto h-[72px] w-[72px] text-2xl"
        />
      </Link>

      <div className="mt-1.5 flex items-start justify-between gap-1">
        <p className="truncate text-[10px] text-blinkit-muted">{product.unit}</p>
        {qty === 0 ? (
          <button
            type="button"
            onClick={handleAdd}
            className="shrink-0 rounded-md border border-blinkit-green bg-white px-2 py-0.5 text-[10px] font-bold text-blinkit-green hover:bg-blinkit-green/5"
          >
            ADD
          </button>
        ) : (
          <div className="flex h-6 items-center overflow-hidden rounded-md border border-blinkit-green text-blinkit-green">
            <button
              type="button"
              aria-label={`Decrease ${product.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setQty(product.id, qty - 1);
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                setQty(product.id, qty + 1);
              }}
              className="flex h-full w-6 items-center justify-center text-xs font-bold"
            >
              +
            </button>
          </div>
        )}
      </div>

      <p className="mt-1 text-xs font-bold text-blinkit-charcoal">
        {formatINR(product.price)}
        {product.mrp && product.mrp > product.price && (
          <span className="ml-1 text-[10px] font-medium text-blinkit-muted line-through">
            {formatINR(product.mrp)}
          </span>
        )}
      </p>
      <Link
        href={`/product/${product.id}`}
        className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-snug text-blinkit-charcoal hover:underline"
      >
        {product.name}
      </Link>
    </article>
  );
}
