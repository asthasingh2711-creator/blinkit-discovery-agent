"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CartFooter } from "@/components/CartFooter";
import { CategoryGrid } from "@/components/CategoryGrid";
import { EmptyAisle } from "@/components/EmptyAisle";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { getProducts } from "@/lib/catalog";
import { useDevice } from "@/lib/device-context";
import { getProduct } from "@/lib/products";
import { useSearch } from "@/lib/search-context";

export default function HomePage() {
  const { isMobile } = useDevice();
  const { query, clearQuery } = useSearch();

  const products = useMemo(() => {
    if (query.trim()) {
      return getProducts({ q: query, limit: 40 })
        .map((p) => getProduct(p.id))
        .filter(Boolean);
    }

    const mission = ["amul-taaza-1l", "britannia-bread", "farm-eggs-6"]
      .map((id) => getProduct(id))
      .filter(Boolean);
    const rest = getProducts({ limit: 16 })
      .filter(
        (p) =>
          !["amul-taaza-1l", "britannia-bread", "farm-eggs-6"].includes(p.id),
      )
      .map((p) => getProduct(p.id))
      .filter(Boolean);
    return [...mission, ...rest].slice(0, 12);
  }, [query]);

  const searching = query.trim().length > 0;

  return (
    <div className="flex min-h-full flex-col bg-white">
      <Header />

      <main className={`flex-1 ${isMobile ? "px-4 pb-4" : "px-6 pb-6"}`}>
        <div className="mt-3 rounded-xl border border-[#E0A800]/bg-[#FFF8D6] px-3 py-2.5">
          <p className="text-xs font-semibold text-blinkit-charcoal">
            Demo catalog — Blinkit-faithful snapshot for MVP walkthrough.
          </p>
        </div>

        <section className="pt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-blinkit-muted">
              {searching ? "Search results" : "Demo mission"}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/demo"
                className="rounded-full bg-blinkit-charcoal px-3 py-1.5 text-xs font-bold text-white"
              >
                Play guided demo
              </Link>
            </div>
          </div>
          <h1 className="mt-0.5 text-lg font-extrabold text-blinkit-charcoal">
            {searching ? `Results for “${query.trim()}”` : "Breakfast mission"}
          </h1>
          <p className="mt-1 text-sm text-blinkit-secondary">
            {searching
              ? "Filtered from the offline demo catalog"
              : "Tap a category below, or search — then add to cart"}
          </p>
          {searching && (
            <button
              type="button"
              onClick={clearQuery}
              className="mt-2 text-xs font-semibold text-blinkit-green"
            >
              Clear search
            </button>
          )}
        </section>

        {!searching && <CategoryGrid />}

        <section className="mt-4">
          {products.length === 0 ? (
            <EmptyAisle />
          ) : (
            <div
              className={
                isMobile
                  ? "grid grid-cols-2 gap-3"
                  : "grid grid-cols-3 gap-4 md:grid-cols-4"
              }
            >
              {products.map((product, i) =>
                product ? (
                  <ProductCard
                    key={product.id}
                    product={product}
                    imagePriority={i < 2}
                  />
                ) : null,
              )}
            </div>
          )}
        </section>

        <SiteFooter />
      </main>

      <CartFooter variant="nav" />
    </div>
  );
}
