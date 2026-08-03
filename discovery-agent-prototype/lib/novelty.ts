import {
  getCatalog,
  getCatalogProduct,
  getCategories,
} from "@/lib/catalog";
import {
  getHouseholdMemory,
  type HouseholdMemory,
} from "@/lib/household/memory";
import { inferBasketKind } from "@/lib/household/outcomes";
import type { DiscoverBasketItem } from "@/lib/discover-types";

/** Resolve L0 aisle id for a product (parent rollup). */
export function getProductL0(productId: string): string | null {
  const p = getCatalogProduct(productId);
  if (!p) return null;
  const cats = getCategories();
  const cat = cats.find((c) => c.id === p.categoryId);
  if (!cat) return p.categoryId;
  return cat.l0 || cat.parent || cat.id;
}

function memoryForBasket(basket: DiscoverBasketItem[]): HouseholdMemory | undefined {
  const kind = inferBasketKind(basket);
  const id =
    kind === "party"
      ? "hosting_household"
      : kind === "wellness"
        ? "wellness_household"
        : "breakfast_household";
  return getHouseholdMemory(id);
}

/**
 * Habitual L0 aisles from seeded purchase history (+ current basket staples).
 * Suggestions must come from outside this set.
 */
export function getHabitualL0s(basket: DiscoverBasketItem[]): Set<string> {
  const habitual = new Set<string>();
  const memory = memoryForBasket(basket);

  for (const h of memory?.purchase_history ?? []) {
    const l0 = getProductL0(h.productId);
    if (l0) habitual.add(l0);
  }

  for (const b of basket) {
    const l0 = getProductL0(b.productId);
    if (l0) habitual.add(l0);
  }

  return habitual;
}

export function isNovelCategory(
  productId: string,
  habitual: Set<string>,
): boolean {
  const l0 = getProductL0(productId);
  if (!l0) return false;
  return !habitual.has(l0);
}

/** Keep only in-stock SKUs from aisles the household does not usually buy. */
export function filterNovelProductIds(
  productIds: string[],
  basket: DiscoverBasketItem[],
): string[] {
  const habitual = getHabitualL0s(basket);
  const novel = productIds.filter((id) => {
    const p = getCatalogProduct(id);
    if (!p?.inStock) return false;
    return isNovelCategory(id, habitual);
  });
  return novel;
}

/**
 * Expand novel candidates from full catalog when the preferred pool collapses.
 * Still requires basket affinity tags / complementary L0s.
 */
export function expandNovelCandidates(
  basket: DiscoverBasketItem[],
  preferIds: string[],
  limit = 12,
): string[] {
  const habitual = getHabitualL0s(basket);
  const kind = inferBasketKind(basket);

  const preferredNovel = filterNovelProductIds(preferIds, basket);
  if (preferredNovel.length >= 2) return preferredNovel.slice(0, limit);

  const affinityL0: Record<string, string[]> = {
    breakfast: [
      "vegetables-fruits",
      "dry-fruits-cereals",
      "sauces-spreads",
      "bath-body",
    ],
    wellness: [
      "health-pharma",
      "drinks-juices",
      "vegetables-fruits",
      "organic-premium",
    ],
    party: [
      "kitchenware-appliances",
      "drinks-juices",
      "sweets-chocolates",
      "paan-corner",
    ],
    general: [
      "vegetables-fruits",
      "drinks-juices",
      "bakery-biscuits",
      "kitchenware-appliances",
      "health-pharma",
    ],
  };

  const want = new Set(affinityL0[kind] ?? affinityL0.general);
  const catalog = getCatalog();
  const extras: string[] = [];

  for (const p of catalog.products) {
    if (!p.inStock) continue;
    if (!isNovelCategory(p.id, habitual)) continue;
    const l0 = getProductL0(p.id);
    if (!l0 || !want.has(l0)) continue;
    if (preferredNovel.includes(p.id) || extras.includes(p.id)) continue;
    // Prefer discovery-tagged, then any in affinity L0
    if (p.tags?.includes("discovery") || preferIds.includes(p.id)) {
      extras.unshift(p.id);
    } else {
      extras.push(p.id);
    }
  }

  return [...preferredNovel, ...extras].slice(0, limit);
}
