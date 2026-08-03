"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlinkitLogo } from "@/components/BlinkitLogo";
import { useCart } from "@/lib/cart-context";
import { useDevice } from "@/lib/device-context";
import { formatINR } from "@/lib/products";
import { useSearch } from "@/lib/search-context";

function SearchBar() {
  const { query, setQuery } = useSearch();
  const router = useRouter();

  return (
    <div className="flex w-full items-center gap-2.5 rounded-xl border border-blinkit-border bg-white px-3.5 py-2.5 shadow-sm">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#808080"
        strokeWidth="2"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          // Keep results on home when typing from other routes
          if (typeof window !== "undefined" && !window.location.pathname.startsWith("/category") && window.location.pathname !== "/") {
            router.push("/");
          }
        }}
        onFocus={() => {
          if (typeof window !== "undefined" && window.location.pathname !== "/" && !window.location.pathname.startsWith("/category")) {
            router.push("/");
          }
        }}
        placeholder={"Search 'milk'"}
        className="w-full bg-transparent text-sm text-blinkit-charcoal outline-none placeholder:text-blinkit-muted"
        aria-label="Search catalog"
      />
    </div>
  );
}

function CartGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.4" fill="currentColor" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function Header() {
  const { isMobile } = useDevice();
  const { itemCount, subtotal } = useCart();

  if (isMobile) {
    return (
      <header className="sticky top-0 z-10 border-b border-blinkit-border/50 bg-[linear-gradient(180deg,#F8C301_0%,#F8C301_45%,#FFFFFF_100%)] px-4 pb-3 pt-2">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <BlinkitLogo size="sm" />
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
            aria-label={`Cart, ${itemCount} items`}
          >
            <CartGlyph />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blinkit-green px-1 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
        <div className="mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-blinkit-charcoal/80">
            Delivery in
          </p>
          <p className="text-lg font-extrabold leading-tight text-blinkit-charcoal">
            8 minutes
          </p>
          <button
            type="button"
            className="mt-0.5 flex items-center gap-1 text-left text-xs font-semibold text-blinkit-charcoal"
          >
            <span>Gurugram · Home</span>
            <span aria-hidden className="text-[10px]">
              ▼
            </span>
          </button>
        </div>
        <SearchBar />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 border-b border-blinkit-border bg-white px-6 py-3">
      <div className="flex items-center gap-5">
        <BlinkitLogo size="lg" />

        <div className="min-w-[140px] shrink-0">
          <p className="text-sm font-extrabold text-blinkit-charcoal">
            Delivery in 8 minutes
          </p>
          <button
            type="button"
            className="flex items-center gap-1 text-left text-xs text-blinkit-secondary"
          >
            <span>Gurugram · Home</span>
            <span aria-hidden className="text-[10px]">
              ▼
            </span>
          </button>
        </div>

        <div className="mx-auto w-full max-w-xl flex-1">
          <div className="rounded-xl border border-[#E0A800]/bg-[#FFF4C2] p-0.5">
            <SearchBar />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            className="text-sm font-semibold text-blinkit-charcoal"
          >
            Login
          </button>
          <Link
            href="/cart"
            className="flex items-center gap-2 rounded-xl bg-blinkit-soft-gray px-3.5 py-2.5 text-sm font-semibold text-blinkit-charcoal transition-colors hover:bg-blinkit-soft"
          >
            <CartGlyph />
            <span>My Cart</span>
            {itemCount > 0 && (
              <span className="rounded-md bg-blinkit-green px-1.5 py-0.5 text-xs font-bold text-white">
                {formatINR(subtotal)}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
