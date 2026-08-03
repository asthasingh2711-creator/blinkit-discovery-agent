"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CartFooter } from "@/components/CartFooter";
import { Header } from "@/components/Header";
import { ProductThumb } from "@/components/ProductThumb";
import { SiteFooter } from "@/components/SiteFooter";
import { getCatalogProduct, formatRatingCount } from "@/lib/catalog";
import { useCart } from "@/lib/cart-context";
import { useDemoToast } from "@/lib/demo-toast";
import { useDevice } from "@/lib/device-context";
import { formatINR, getProduct } from "@/lib/products";

export default function ProductPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const product = getProduct(id);
  const catalogProduct = getCatalogProduct(id);
  const { isMobile } = useDevice();
  const { lines, addProduct, setQty } = useCart();
  const { showToast } = useDemoToast();
  const qty = lines.find((l) => l.productId === id)?.qty ?? 0;

  if (!product) {
    return (
      <div className="flex min-h-full flex-col bg-white">
        <Header />
        <main className="px-4 py-10 text-center">
          <p className="text-sm font-semibold text-blinkit-charcoal">
            Product not in demo catalog
          </p>
          <Link href="/" className="mt-3 inline-block text-sm font-semibold text-blinkit-green">
            Back home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <Header />

      <main
        className={`flex-1 ${isMobile ? "px-4 pb-4" : "mx-auto w-full max-w-xl px-6 pb-6"}`}
      >
        <Link
          href="/"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blinkit-green"
        >
          ← Continue shopping
        </Link>

        <div className="mt-4 overflow-hidden rounded-2xl border border-blinkit-border bg-white p-4">
          <ProductThumb product={product} size="lg" priority />
          <p className="mt-3 text-xs text-blinkit-muted">{product.unit}</p>
          <h1 className="mt-1 text-xl font-extrabold text-blinkit-charcoal">
            {product.name}
          </h1>
          {product.brand && (
            <p className="mt-0.5 text-sm text-blinkit-secondary">{product.brand}</p>
          )}
          <p className="mt-2 text-lg font-extrabold text-blinkit-charcoal">
            {formatINR(product.price)}
            {product.mrp && product.mrp > product.price && (
              <span className="ml-2 text-sm font-medium text-blinkit-muted line-through">
                {formatINR(product.mrp)}
              </span>
            )}
          </p>
          {catalogProduct && (
            <p className="mt-1 text-xs text-blinkit-secondary">
              ★ {catalogProduct.rating.toFixed(1)} ·{" "}
              {formatRatingCount(catalogProduct.ratingCount)} ·{" "}
              {catalogProduct.returnWindow}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            {qty === 0 ? (
              <button
                type="button"
                onClick={() => {
                  addProduct(product.id);
                  showToast(`Added ${product.name}`, 1400);
                }}
                className="flex-1 rounded-xl bg-blinkit-green py-3 text-sm font-bold text-white hover:bg-blinkit-green-dark"
              >
                Add to cart
              </button>
            ) : (
              <div className="flex h-12 flex-1 items-center justify-between rounded-xl border-2 border-blinkit-green px-4 text-blinkit-green">
                <button
                  type="button"
                  aria-label="Decrease"
                  onClick={() => setQty(product.id, qty - 1)}
                  className="text-xl font-bold"
                >
                  −
                </button>
                <span className="text-sm font-bold">{qty} in cart</span>
                <button
                  type="button"
                  aria-label="Increase"
                  onClick={() => setQty(product.id, qty + 1)}
                  className="text-xl font-bold"
                >
                  +
                </button>
              </div>
            )}
            <Link
              href="/cart"
              className="rounded-xl border border-blinkit-border bg-blinkit-soft-gray px-4 py-3 text-sm font-bold text-blinkit-charcoal"
            >
              Cart
            </Link>
          </div>
        </div>

        <SiteFooter />
      </main>

      <CartFooter variant="nav" />
    </div>
  );
}
