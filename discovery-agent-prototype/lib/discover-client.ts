import type {
  DiscoverCandidateInput,
  DiscoverRequest,
  DiscoverResponse,
} from "@/lib/discover-types";
import { getCatalogProduct, getStoreStockMap } from "@/lib/catalog";
import { DEMO_STORE_ID } from "@/lib/discovery-system-prompt";
import { getDiscoveryPoolsForBasket } from "@/lib/discovery-pool";
import { DISCOVERY_CANDIDATES } from "@/lib/discovery-candidates";
import { getHouseholdMemory } from "@/lib/household/memory";
import { inferHistoryGaps } from "@/lib/household/outcomes";

export async function fetchDiscoverRank(
  req: DiscoverRequest,
): Promise<DiscoverResponse> {
  try {
    const res = await fetch("/api/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`discover ${res.status}`);
    const data = (await res.json()) as DiscoverResponse;
    if (
      !data?.explanation_slots ||
      (!data.similar_ids?.length && !data.completion_ids?.length)
    ) {
      throw new Error("invalid discover response");
    }
    return data;
  } catch {
    return localRulesFallback(req);
  }
}

function localRulesFallback(req: DiscoverRequest): DiscoverResponse {
  const similar_ids = (req.similar_candidate_ids ?? [])
    .filter((id) => !(req.exclude_ids ?? []).includes(id))
    .slice(0, 3);
  const completion_ids = (req.completion_candidate_ids ?? [])
    .filter(
      (id) =>
        !(req.exclude_ids ?? []).includes(id) && !similar_ids.includes(id),
    )
    .slice(0, 3);
  const chosen_id = completion_ids[0] ?? similar_ids[0] ?? "sprite";

  return {
    need_id: req.inferred_need.need_id,
    need_label: req.inferred_need.label,
    confidence: req.inferred_need.confidence,
    similar_ids,
    completion_ids,
    need_solution_ids: completion_ids,
    complementary_id: completion_ids[0] ?? null,
    chosen_id,
    picks: [
      ...similar_ids.map((id, i) => ({
        id,
        role: (i === 0 ? "primary" : "alternative") as
          | "primary"
          | "alternative",
        rail: "similar" as const,
      })),
      ...completion_ids.map((id, i) => ({
        id,
        role: (i === 0 ? "primary" : "alternative") as
          | "primary"
          | "alternative",
        rail: "completion" as const,
      })),
    ],
    explanation_slots: {
      mission: req.inferred_need.mission,
      bridge: `Similar aisle swaps plus what completes ${req.inferred_need.label.toLowerCase()}`,
      why_lines: req.inferred_need.why_lines,
    },
    reject_ids: [],
    source: "rules",
  };
}

function toCandidate(
  id: string,
  historyIds: Set<string>,
  rail: "similar" | "completion",
): DiscoverCandidateInput {
  const p = getCatalogProduct(id);
  const disc = DISCOVERY_CANDIDATES.find((d) => d.productId === id);
  return {
    id,
    title: disc?.title ?? p?.name ?? id,
    name: p?.name ?? id,
    category: p?.categoryId ?? "grocery",
    unit: p?.unit ?? "",
    in_stock: p?.inStock !== false,
    rating: p?.rating ?? disc?.rating ?? 4.0,
    rating_count: p?.ratingCount ?? 500,
    price: p?.price ?? 99,
    never_purchased: !historyIds.has(id),
    rail,
  };
}

export function buildDiscoverRequestBase(partial: {
  basket: DiscoverRequest["basket"];
  urgency: DiscoverRequest["urgency"];
  useGemini: boolean;
  excludeIds: string[];
}): DiscoverRequest {
  const basketIds = partial.basket.map((b) => b.productId);
  const pools = getDiscoveryPoolsForBasket(basketIds);
  const exclude = new Set(partial.excludeIds);

  const memory =
    getHouseholdMemory(
      pools.inference.need_id === "hosting" ||
        pools.inference.need_id === "snacking"
        ? "hosting_household"
        : pools.inference.need_id === "recovery" ||
            pools.inference.need_id === "hydration"
          ? "wellness_household"
          : "breakfast_household",
    );
  const historyIds = new Set(
    memory?.purchase_history.map((h) => h.productId) ?? [],
  );

  const similarIds = pools.similarIds.filter((id) => !exclude.has(id));
  const completionIds = pools.completionIds.filter((id) => !exclude.has(id));
  const candidates = [
    ...similarIds.map((id) => toCandidate(id, historyIds, "similar")),
    ...completionIds.map((id) => toCandidate(id, historyIds, "completion")),
  ];

  return {
    basket: partial.basket,
    urgency: partial.urgency,
    candidates,
    similar_candidate_ids: similarIds,
    completion_candidate_ids: completionIds,
    need_candidate_ids: [...similarIds, ...completionIds],
    complementary_candidate_ids: completionIds,
    inferred_need: {
      need_id: pools.inference.need_id,
      label: pools.inference.label,
      confidence: pools.inference.confidence,
      mission: pools.inference.mission,
      why_lines: [...pools.inference.why_lines],
    },
    store_stock: getStoreStockMap(),
    store_id: DEMO_STORE_ID,
    user_category_history_gaps: inferHistoryGaps(partial.basket),
    useGemini: partial.useGemini,
    exclude_ids: partial.excludeIds,
    recently_rejected: partial.excludeIds,
  };
}

export const STORE_STOCK = getStoreStockMap();
