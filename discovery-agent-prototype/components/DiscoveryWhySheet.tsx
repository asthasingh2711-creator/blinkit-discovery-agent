"use client";

import { formatRatingCount } from "@/lib/catalog";

type DiscoveryWhySheetProps = {
  open: boolean;
  onClose: () => void;
  customerHeadline: string;
  bodyLines?: string[];
  /** Suggested SKU trust cues (Slide 8) */
  productName?: string;
  rating?: number;
  ratingCount?: number;
  returnWindow?: string;
  novelCategoryLabel?: string;
  /** Prototype-only PM reasoning — clearly marked not for customers */
  pmReasoning?: string;
};

/** Customer-facing why sheet + optional PM reasoning panel for reviewers. */
export function DiscoveryWhySheet({
  open,
  onClose,
  customerHeadline,
  bodyLines,
  productName,
  rating,
  ratingCount,
  returnWindow,
  novelCategoryLabel,
  pmReasoning,
}: DiscoveryWhySheetProps) {
  if (!open) return null;

  const lines = (bodyLines ?? []).filter(Boolean).slice(0, 4);
  const hasTrust =
    typeof rating === "number" &&
    typeof ratingCount === "number" &&
    Boolean(returnWindow);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="why-seeing-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-white px-4 pb-6 pt-4 shadow-xl sm:rounded-2xl sm:pb-5"
      >
        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-blinkit-border sm:hidden" />
        <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
          <p
            id="why-seeing-title"
            className="text-base font-extrabold text-blinkit-charcoal"
          >
            Why am I seeing this?
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm font-semibold text-blinkit-muted hover:bg-blinkit-soft-gray"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          <div className="space-y-2 text-[13px] leading-snug text-blinkit-secondary">
            <p className="font-semibold text-blinkit-charcoal">
              {customerHeadline}
            </p>
            {lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {novelCategoryLabel && (
              <p>
                {novelCategoryLabel} isn&apos;t in your cart yet — trying it now
                saves a second order.
              </p>
            )}
          </div>

          {hasTrust && (
            <div className="rounded-xl bg-blinkit-soft-gray px-3 py-2.5">
              {productName && (
                <p className="mb-0.5 text-[11px] font-semibold text-blinkit-charcoal">
                  {productName}
                </p>
              )}
              <p className="text-[12px] font-medium text-blinkit-secondary">
                ★ {rating!.toFixed(1)} · {formatRatingCount(ratingCount!)} ·{" "}
                {returnWindow}
              </p>
            </div>
          )}

          {pmReasoning && (
            <div className="rounded-xl border border-dashed border-[#C4B5A0] bg-[#FFFBF2] p-3">
              <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#8B6914]">
                PM reasoning — not shown to customers
              </p>
              <p className="mb-2 text-[11px] leading-snug text-blinkit-secondary">
                Reviewer / fellowship only. Explains the category-expansion bet
                behind this card.
              </p>
              <textarea
                readOnly
                value={pmReasoning}
                rows={14}
                className="w-full resize-y rounded-lg border border-[#E8D48A] bg-white px-2.5 py-2 font-mono text-[10px] leading-relaxed text-blinkit-charcoal outline-none"
                aria-label="PM reasoning (not shown to customers)"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full shrink-0 rounded-xl bg-blinkit-green py-2.5 text-sm font-bold text-white hover:bg-blinkit-green-dark"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
