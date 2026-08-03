"use client";

export function CouponsRow() {
  return (
    <section className="rounded-2xl border border-blinkit-border bg-white">
      <button
        type="button"
        disabled
        className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left opacity-70"
        title="Coupons are non-functional in this prototype"
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF5FF] text-sm"
          aria-hidden
        >
          %
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-blinkit-charcoal">
            Use coupons
          </p>
          <p className="text-[11px] text-blinkit-muted">
            View available offers
          </p>
        </div>
        <span className="text-sm text-blinkit-muted" aria-hidden>
          ›
        </span>
      </button>
    </section>
  );
}
