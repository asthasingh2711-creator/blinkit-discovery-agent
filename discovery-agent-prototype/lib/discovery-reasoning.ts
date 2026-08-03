import { labelL0 } from "@/lib/l0-affinity";
import type { NeedInference } from "@/lib/needs";
import { getProductL0 } from "@/lib/novelty";
import { getCatalogProduct } from "@/lib/catalog";

export type ReasoningPack = {
  /** Customer-facing Why lines (no jargon) */
  customerLines: string[];
  customerHeadline: string;
  /** PM / reviewer only — never ship as customer UI in production */
  pmReasoning: string;
};

function itemLine(productId: string): string {
  const p = getCatalogProduct(productId);
  const l0 = getProductL0(productId);
  const name = p?.name ?? productId;
  return `${name} (${labelL0(l0 ?? "unknown")})`;
}

/**
 * Build customer + PM reasoning from the full cart and selected picks.
 * PM text explains CER logic in plain product language (no API/field names).
 */
export function buildReasoningPack(args: {
  cartProductIds: string[];
  inference: NeedInference;
  pickIds: string[];
}): ReasoningPack {
  const { cartProductIds, inference, pickIds } = args;
  const cartLabels = inference.cart_l0s.map(labelL0);
  const pickSummaries = pickIds.map((id) => {
    const p = getCatalogProduct(id);
    const l0 = getProductL0(id);
    return {
      name: p?.name ?? id,
      l0: l0 ?? "",
      label: labelL0(l0 ?? "unknown"),
    };
  });

  const customerHeadline =
    inference.mode === "same_aisle"
      ? `Suggested to finish your ${inference.label.toLowerCase()} run — so you need fewer follow-up orders.`
      : `Suggested to add a category still missing from this trip — so you need fewer follow-up orders.`;

  const customerLines = [
    ...inference.why_lines.filter(Boolean),
    pickSummaries.length > 0
      ? `We're showing ${pickSummaries.map((p) => p.label).join(" and ")} because ${
          inference.mode === "same_aisle"
            ? "it matches what you already started in this aisle"
            : "those aisles aren't in your cart yet"
        }.`
      : "",
  ].filter(Boolean);

  const cartBlock = cartProductIds
    .slice(0, 10)
    .map((id, i) => `  ${i + 1}. ${itemLine(id)}`)
    .join("\n");

  const missing = inference.target_l0s
    .slice(0, 6)
    .map(labelL0)
    .join(" → ");

  const picksBlock = pickSummaries
    .map((p, i) => `  ${i + 1}. ${p.name} — new aisle: ${p.label}`)
    .join("\n");

  const modeExplain =
    inference.mode === "same_aisle"
      ? "Sensitive aisle cart (sexual wellness / feminine hygiene): stay inside the aisle — never push grocery filler."
      : inference.mode === "suppress"
        ? "Card suppressed — cart is only stores/e-cards (not a trip-finish mission)."
        : "Category expansion (CER): every suggestion must be from an aisle that does NOT already appear in this cart.";

  const special =
    inference.need_id === "hosting"
      ? "Special read: chips + soft drink → hosting mission → disposables (kitchenware) finish the gathering."
      : inference.need_id === "breakfast"
        ? "Special read: milk/bread/eggs staples → breakfast mission → fruit/yogurt is the usual missing piece."
        : inference.need_id === "recovery"
          ? "Special read: pharmacy-led cart → recovery mission → hydration / light food finishes the run."
          : "Mission read from the mix of aisles in the cart (all line items counted).";

  const pmReasoning = [
    "PM reasoning (prototype only — this block is NOT shown to customers)",
    "",
    "1) Cart input (all items used)",
    cartBlock || "  (empty)",
    "",
    `Aisles present: ${cartLabels.join(", ") || "none"}`,
    `Mission label: ${inference.label} (${inference.need_id})`,
    special,
    "",
    "2) Expansion rule",
    modeExplain,
    inference.mode === "complement"
      ? `Missing aisles ranked for this cart: ${missing || "(none)"}`
      : `Same-aisle candidates only within: ${cartLabels.join(", ")}`,
    "",
    "3) Why these picks",
    picksBlock || "  (no picks)",
    "",
    "4) What we deliberately avoided",
    inference.mode === "complement"
      ? `• More of ${cartLabels.join(" / ") || "current aisles"} — already in cart, would not move new-category trial (CER)`
      : "• Grocery / unrelated aisles — would feel random and break trust on a sensitive trip",
    "• Free-form AI claims — copy is templated from cart aisles + pick aisle only",
    "",
    "5) Product bet (one line)",
    "If an explained, novel-aisle add on checkout raises first-time category trial without hurting checkout → CER rises; if not, retune affinity or silence — not 'add more AI'.",
  ].join("\n");

  return {
    customerLines: customerLines.slice(0, 4),
    customerHeadline,
    pmReasoning,
  };
}
