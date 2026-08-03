"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { ProductThumb } from "@/components/ProductThumb";
import { useCart } from "@/lib/cart-context";
import { useDemoToast } from "@/lib/demo-toast";
import { formatINR, type Product } from "@/lib/products";

type ProductCardProps = {
  product: Product;
  imagePriority?: boolean;
};

export function ProductCard({
  product,
  imagePriority = false,
}: ProductCardProps) {
  const { lines, addProduct, setQty } = useCart();
  const { showToast } = useDemoToast();
  const line = lines.find((l) => l.productId === product.id);
  const qty = line?.qty ?? 0;

  function handleAdd(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addProduct(product.id);
    showToast(`Added ${product.name}`, 1400);
  }

  return (
    <article className="flex flex-col rounded-2xl border border-blinkit-border/80 bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <Link
        href={`/product/${product.id}`}
        className="block"
        aria-label={`View ${product.name}`}
      >
        <ProductThumb product={product} size="md" priority={imagePriority} />
      </Link>

      <div className="mt-2 flex items-start justify-between gap-1">
        <p className="text-xs text-blinkit-muted">{product.unit}</p>
        {qty === 0 ? (
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-lg border border-blinkit-green bg-white px-2.5 py-0.5 text-xs font-bold text-blinkit-green hover:bg-blinkit-green/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blinkit-charcoal"
          >
            ADD
          </button>
        ) : (
          <div className="flex h-7 items-center overflow-hidden rounded-lg border border-blinkit-green text-blinkit-green">
            <button
              type="button"
              aria-label={`Decrease ${product.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setQty(product.id, qty - 1);
              }}
              className="flex h-full w-7 items-center justify-center text-sm font-bold"
            >
              −
            </button>
            <span className="min-w-5 text-center text-xs font-bold">{qty}</span>
            <button
              type="button"
              aria-label={`Increase ${product.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setQty(product.id, qty + 1);
              }}
              className="flex h-full w-7 items-center justify-center text-sm font-bold"
            >
              +
            </button>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-sm font-bold text-blinkit-charcoal">
        {formatINR(product.price)}
        {product.mrp && product.mrp > product.price && (
          <span className="ml-1.5 text-xs font-medium text-blinkit-muted line-through">
            {formatINR(product.mrp)}
          </span>
        )}
      </p>
      <Link
        href={`/product/${product.id}`}
        className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-blinkit-charcoal hover:underline"
      >
        {product.name}
      </Link>
    </article>
  );
}
