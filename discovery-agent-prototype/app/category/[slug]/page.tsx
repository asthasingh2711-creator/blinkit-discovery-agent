"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { CartFooter } from "@/components/CartFooter";
import { EmptyAisle } from "@/components/EmptyAisle";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { getCategories, getProducts } from "@/lib/catalog";
import { useDevice } from "@/lib/device-context";
import { getProduct } from "@/lib/products";
import { useSearch } from "@/lib/search-context";

export default function CategoryPage() {
  const params = useParams();
  const slug = String(params.slug ?? "");
  const { isMobile } = useDevice();
  const { query, clearQuery } = useSearch();

  const category = getCategories().find((c) => c.id === slug);

  const products = useMemo(() => {
    const list = getProducts({
      categoryId: slug,
      q: query.trim() || undefined,
      limit: 48,
    });
    return list.map((p) => getProduct(p.id)).filter(Boolean);
  }, [slug, query]);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <Header />

      <main className={`flex-1 ${isMobile ? "px-4 pb-4" : "px-6 pb-6"}`}>
        <div className="mt-3 rounded-xl border border-[#E0A800]/bg-[#FFF8D6] px-3 py-2.5">
          <p className="text-xs font-semibold text-blinkit-charcoal">
            Demo catalog — Blinkit-faithful snapshot for MVP walkthrough.
          </p>
        </div>

        <header className="flex items-start gap-3 pt-4">
          <Link
            href="/"
            onClick={() => clearQuery()}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-blinkit-soft-gray"
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
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blinkit-muted">
              Category
            </p>
            <h1 className="text-lg font-extrabold text-blinkit-charcoal">
              {category?.name ?? "Aisle"}
            </h1>
            <p className="mt-0.5 text-sm text-blinkit-secondary">
              {query.trim()
                ? `Filtered by “${query.trim()}” in this aisle`
                : `${products.length} products in demo aisle`}
            </p>
          </div>
        </header>

        <section className="mt-4">
          {!category ? (
            <EmptyAisle
              title="Unknown demo aisle"
              hint="Go back home and pick a category from the grid."
            />
          ) : products.length === 0 ? (
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
