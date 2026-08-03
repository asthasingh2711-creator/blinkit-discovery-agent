import { getCatalogProduct } from "@/lib/catalog";
import { getHouseholdMemory } from "@/lib/household/memory";
import { labelL0 } from "@/lib/l0-affinity";
import {
  ALSO_LIKE_POOL,
  catalogIdsForL0s,
  filterByConfidence,
  inStockId,
  inferNeed,
  NEED_GRAPHS,
  type NeedId,
} from "@/lib/needs";
import { getHabitualL0s, getProductL0, isNovelCategory } from "@/lib/novelty";
import type { DiscoverBasketItem } from "@/lib/discover-types";

export type DiscoveryPools = {
  similarIds: string[];
  completionIds: string[];
  alsoLikeIds: string[];
  /** @deprecated alias of completionIds */
  needIds: string[];
  allIds: string[];
  inference: ReturnType<typeof inferNeed>;
  usuallyBought: string[];
  neverPurchasedLabels: string[];
  /** Hide Discovery card entirely */
  suppress: boolean;
};

function memoryIdForNeed(needId: NeedId): string {
  if (needId === "hosting" || needId === "snacking") return "hosting_household";
  if (needId === "recovery" || needId === "hydration")
    return "wellness_household";
  return "breakfast_household";
}

function neverLabel(productId: string): string {
  const l0 = getProductL0(productId);
  if (l0) return labelL0(l0);
  const p = getCatalogProduct(productId);
  return p?.name.split(" ").slice(0, 2).join(" ") ?? productId;
}

function basketL0s(basketProductIds: string[]): Set<string> {
  const s = new Set<string>();
  for (const id of basketProductIds) {
    const l0 = getProductL0(id);
    if (l0) s.add(l0);
  }
  return s;
}

function uniquePush(target: string[], ids: string[], cart: Set<string>) {
  for (const id of ids) {
    if (cart.has(id) || !inStockId(id) || target.includes(id)) continue;
    target.push(id);
  }
}

/**
 * Build ranked pools from cart L0 affinity + catalog.
 * Never pads with orphan grocery when mission is same-aisle / suppress.
 */
export function getDiscoveryPoolsForBasket(
  basketProductIds: string[],
): DiscoveryPools {
  const basket: DiscoverBasketItem[] = basketProductIds.map((productId) => {
    const p = getCatalogProduct(productId);
    return {
      productId,
      name: p?.name ?? productId,
      qty: 1,
      category: p?.categoryId,
    };
  });

  const cart = new Set(basketProductIds);
  const cartL0 = basketL0s(basketProductIds);
  const inference = inferNeed(basket);
  const habitual = getHabitualL0s(basket);

  if (inference.mode === "suppress" || inference.target_l0s.length === 0) {
    return {
      similarIds: [],
      completionIds: [],
      alsoLikeIds: [],
      needIds: [],
      allIds: [],
      inference,
      usuallyBought: [],
      neverPurchasedLabels: [],
      suppress: true,
    };
  }

  const seedGraph = NEED_GRAPHS[inference.need_id] ?? NEED_GRAPHS.aisle;
  const catalogPool = catalogIdsForL0s(inference.target_l0s, cart, 40);

  // Seed preferred ids from named graphs when present, then catalog fill
  let completionIds: string[] = [];
  if (inference.mode === "same_aisle") {
    uniquePush(completionIds, catalogPool, cart);
  } else {
    const seedCompletions = (seedGraph?.completionIds ?? []).filter((id) => {
      const l0 = getProductL0(id);
      return Boolean(
        l0 &&
          inference.target_l0s.includes(l0) &&
          !cart.has(id) &&
          inStockId(id),
      );
    });
    uniquePush(
      completionIds,
      filterByConfidence(seedCompletions, inference.confidence),
      cart,
    );
    uniquePush(completionIds, catalogPool, cart);
    const cross = completionIds.filter((id) => {
      const l0 = getProductL0(id);
      return Boolean(l0 && !cartL0.has(l0));
    });
    if (cross.length >= 1) completionIds = cross;
  }

  let similarIds: string[] = [];
  if (inference.mode === "complement") {
    // Similar = same-intent other L0 from remaining complements / same mission vibe
    const similarTargets = inference.target_l0s.slice(1, 4);
    const similarPool = catalogIdsForL0s(
      similarTargets.length ? similarTargets : inference.target_l0s,
      cart,
      20,
    );
    uniquePush(
      similarIds,
      filterByConfidence(seedGraph?.similarIds ?? [], inference.confidence),
      cart,
    );
    similarIds = similarIds.filter((id) => {
      const l0 = getProductL0(id);
      return Boolean(l0 && !cartL0.has(l0));
    });
    uniquePush(similarIds, similarPool, cart);
    similarIds = similarIds.filter((id) => !completionIds.includes(id));
  }

  const novelSort = (ids: string[]) =>
    [...ids].sort((a, b) => {
      if (inference.mode === "same_aisle") {
        const ra = getCatalogProduct(a)?.rating ?? 0;
        const rb = getCatalogProduct(b)?.rating ?? 0;
        return rb - ra || a.localeCompare(b);
      }
      const an = isNovelCategory(a, habitual) ? 0 : 1;
      const bn = isNovelCategory(b, habitual) ? 0 : 1;
      const l0a = getProductL0(a);
      const l0b = getProductL0(b);
      const ra = l0a ? inference.target_l0s.indexOf(l0a) : 99;
      const rb = l0b ? inference.target_l0s.indexOf(l0b) : 99;
      const rankA = ra === -1 ? 99 : ra;
      const rankB = rb === -1 ? 99 : rb;
      // Prefer graph seeds (paper-plates etc.) ahead of catalog fill
      const seedList = seedGraph?.completionIds ?? [];
      const seed = new Set(seedList);
      const sa = seed.has(a) ? 0 : 1;
      const sb = seed.has(b) ? 0 : 1;
      const seedRank = (id: string) => {
        const i = seedList.indexOf(id);
        return i === -1 ? 999 : i;
      };
      return (
        sa - sb ||
        seedRank(a) - seedRank(b) ||
        an - bn ||
        rankA - rankB ||
        a.localeCompare(b)
      );
    });

  completionIds = novelSort([...new Set(completionIds)]).slice(0, 16);

  // Build up to 6 picks: one per target L0 first (fetch from catalog if needed)
  {
    const picked: string[] = [];
    const seenL0 = new Set<string>();
    const cart = new Set(basketProductIds);

    for (const l0 of inference.target_l0s) {
      if (picked.length >= 6) break;
      let id = completionIds.find(
        (x) => getProductL0(x) === l0 && !picked.includes(x),
      );
      if (!id) {
        id = catalogIdsForL0s([l0], cart, 1).find((x) => !picked.includes(x));
      }
      if (!id) continue;
      picked.push(id);
      seenL0.add(l0);
    }
    for (const id of completionIds) {
      if (picked.length >= 6) break;
      const l0 = getProductL0(id);
      if (!l0) continue;
      if (inference.mode === "complement" && seenL0.has(l0)) continue;
      picked.push(id);
      seenL0.add(l0);
    }
    for (const id of completionIds) {
      if (picked.length >= 6) break;
      if (!picked.includes(id)) picked.push(id);
    }
    // Still short? pull more novel L0s from remaining targets / fallbacks
    if (picked.length < 6 && inference.mode === "complement") {
      const more = catalogIdsForL0s(inference.target_l0s, cart, 24);
      for (const id of more) {
        if (picked.length >= 6) break;
        const l0 = getProductL0(id);
        if (!l0 || seenL0.has(l0) || picked.includes(id)) continue;
        picked.push(id);
        seenL0.add(l0);
      }
    }
    completionIds = picked;
  }
  similarIds = novelSort([...new Set(similarIds)])
    .filter((id) => !completionIds.includes(id))
    .slice(0, 6);

  const alsoLikeIds: string[] = [];
  const block = new Set([...cart, ...completionIds.slice(0, 3), ...similarIds.slice(0, 3)]);
  for (const id of ALSO_LIKE_POOL) {
    if (alsoLikeIds.length >= 6) break;
    if (block.has(id) || !inStockId(id)) continue;
    alsoLikeIds.push(id);
  }

  const memory = getHouseholdMemory(memoryIdForNeed(inference.need_id));
  const historyIds = new Set(
    memory?.purchase_history.map((h) => h.productId) ?? [],
  );
  const usuallyBought =
    memory?.purchase_history.map((h) =>
      h.name.replace(/Amul |Britannia |Farm Fresh |Packaged /gi, "").trim(),
    ) ?? [];

  const neverPurchasedLabels: string[] = [];
  for (const id of completionIds) {
    if (historyIds.has(id)) continue;
    const label = neverLabel(id);
    if (!neverPurchasedLabels.includes(label)) {
      neverPurchasedLabels.push(label);
    }
    if (neverPurchasedLabels.length >= 4) break;
  }

  return {
    similarIds,
    completionIds,
    alsoLikeIds,
    needIds: completionIds,
    allIds: [...completionIds, ...similarIds],
    inference,
    usuallyBought: usuallyBought.slice(0, 4),
    neverPurchasedLabels,
    suppress: completionIds.length === 0,
  };
}

export function getDiscoveryPoolForBasket(
  basketProductIds: string[],
): string[] {
  return getDiscoveryPoolsForBasket(basketProductIds).allIds;
}
