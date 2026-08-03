type EmptyAisleProps = {
  title?: string;
  hint?: string;
};

export function EmptyAisle({
  title = "No products in this demo aisle",
  hint = "Try another category or clear search.",
}: EmptyAisleProps) {
  return (
    <div className="rounded-2xl border border-dashed border-blinkit-border bg-blinkit-soft-gray px-4 py-10 text-center">
      <p className="text-sm font-semibold text-blinkit-charcoal">{title}</p>
      <p className="mt-1 text-xs text-blinkit-muted">{hint}</p>
    </div>
  );
}
