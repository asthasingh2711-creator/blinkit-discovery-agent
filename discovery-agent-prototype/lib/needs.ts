import { getCatalog, getCatalogProduct } from "@/lib/catalog";
import type { DiscoverBasketItem } from "@/lib/discover-types";
import {
  COMPLEMENT_L0,
  SAME_AISLE_ONLY,
  SUPPRESS_L0,
  isBreakfastCombo,
  isHostingCombo,
  labelL0,
  novelComplementTargets,
} from "@/lib/l0-affinity";
import { getProductL0 } from "@/lib/novelty";

/** Mission id — L0-driven or named specials for thesis carts. */
export type NeedId =
  | "breakfast"
  | "hydration"
  | "recovery"
  | "hosting"
  | "snacking"
  | "staples"
  | "pet"
  | "baby"
  | "selfcare"
  | "same_aisle"
  | "aisle"
  | "suppress"
  | "general";

export type NeedInference = {
  need_id: NeedId;
  label: string;
  confidence: number;
  mission: string;
  why_lines: [string, string];
  /** Dominant cart L0s (sorted by count) */
  cart_l0s: string[];
  /** How candidates should be built */
  mode: "complement" | "same_aisle" | "suppress";
  /** Target L0s for completion candidates (best-first) */
  target_l0s: string[];
};

export type NeedGraph = {
  label: string;
  similarIds: string[];
  completionIds: string[];
};

/**
 * Legacy named graphs — still used as preferred seed ids when mission matches.
 * Catalog L0 fill covers everything else.
 */
export const NEED_GRAPHS: Record<string, NeedGraph> = {
  breakfast: {
    label: "Breakfast",
    similarIds: [
      "saffola-oats",
      "kelloggs-cornflakes",
      "peanut-butter",
      "amul-butter",
      "nestle-aplus",
    ],
    completionIds: [
      "fresh-fruit-cup",
      "epigamia-greek-yogurt",
      "banana",
      "apple-shimla",
      "chia-seeds",
    ],
  },
  hydration: {
    label: "Hydration",
    similarIds: ["maaza", "real-juice", "sprite", "coca-cola"],
    completionIds: [
      "coconut-water",
      "ors-electral",
      "california-almonds",
      "banana",
    ],
  },
  recovery: {
    label: "Recovery",
    similarIds: ["vicks-vaporub", "kinley-water", "california-almonds"],
    completionIds: [
      "california-almonds",
      "fresh-fruit-cup",
      "banana",
      "coconut-water",
    ],
  },
  hosting: {
    label: "Hosting",
    similarIds: [
      "oreo",
      "cadbury-dairy-milk",
      "parle-g",
      "kurkure",
      "maaza",
    ],
    completionIds: [
      "paper-plates",
      "paper-cups",
      "center-fresh",
      "sprite",
      "coca-cola",
    ],
  },
  snacking: {
    label: "Snacking",
    similarIds: [
      "oreo",
      "parle-g",
      "cadbury-dairy-milk",
      "kitkat",
      "real-juice",
      "maaza",
    ],
    completionIds: [
      "sprite",
      "coca-cola",
      "paper-plates",
      "center-fresh",
      "maaza",
    ],
  },
  staples: {
    label: "Home staples",
    similarIds: [
      "toor-dal",
      "india-gate-basmati",
      "mdh-garam",
      "fortune-oil",
    ],
    completionIds: ["tata-salt", "maggi", "onion", "tomato", "surf-excel"],
  },
  pet: {
    label: "Pet care",
    similarIds: ["pedigree", "whiskas", "me-o"],
    completionIds: ["dog-treats", "tick-shampoo", "puppy-pads"],
  },
  baby: {
    label: "Baby care",
    similarIds: ["pampers", "huggies", "nestle-aplus"],
    completionIds: ["cerelac", "johnson-baby", "himalaya-facewash"],
  },
  selfcare: {
    label: "Self-care",
    similarIds: [
      "skin-face-lip-and-eye-care-1",
      "bath-body-shower-gels-and-scrubs-2",
      "dettol-soap",
    ],
    completionIds: [
      "bath-body-bathing-soaps-1",
      "hair-care-shampoo-1",
      "dettol-soap",
      "himalaya-facewash",
    ],
  },
  same_aisle: {
    label: "This aisle",
    similarIds: [],
    completionIds: [],
  },
  aisle: {
    label: "This trip",
    similarIds: [],
    completionIds: [],
  },
  suppress: {
    label: "Hidden",
    similarIds: [],
    completionIds: [],
  },
  general: {
    label: "This trip",
    similarIds: [],
    completionIds: [],
  },
};

export const ALSO_LIKE_POOL = [
  "amul-taaza-1l",
  "britannia-bread",
  "farm-eggs-6",
  "maggi",
  "yippee",
  "lays-classic",
  "lays-magic",
  "kurkure",
  "oreo",
  "parle-g",
  "coca-cola",
  "sprite",
  "maaza",
  "real-juice",
  "cadbury-dairy-milk",
  "kitkat",
  "dettol-soap",
  "surf-excel",
  "tata-gold",
  "amul-butter",
  "mother-dairy-curd",
  "tomato",
  "onion",
  "banana",
] as const;

function basketText(basket: DiscoverBasketItem[]) {
  return basket
    .map((b) => `${b.name} ${b.productId} ${b.category ?? ""}`.toLowerCase())
    .join(" ");
}

function countCartL0s(basket: DiscoverBasketItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const b of basket) {
    const l0 = getProductL0(b.productId);
    if (!l0) continue;
    counts.set(l0, (counts.get(l0) ?? 0) + Math.max(1, b.qty || 1));
  }
  return counts;
}

function sortedL0s(counts: Map<string, number>): string[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([l0]) => l0);
}

function cartLabelList(l0s: string[]): string {
  return l0s
    .slice(0, 2)
    .map(labelL0)
    .join(" + ");
}

/**
 * Infer mission from cart L0s. Specials (hosting/breakfast/recovery) win when clear;
 * otherwise L0 affinity drives candidates — never orphan grocery filler.
 */
export function inferNeed(basket: DiscoverBasketItem[]): NeedInference {
  if (basket.length === 0) {
    return {
      need_id: "suppress",
      label: "Hidden",
      confidence: 0,
      mission: "",
      why_lines: ["", ""],
      cart_l0s: [],
      mode: "suppress",
      target_l0s: [],
    };
  }

  const t = basketText(basket);
  const counts = countCartL0s(basket);
  const cartL0s = sortedL0s(counts);
  const l0Set = new Set(cartL0s);
  const primary = cartL0s[0] ?? "";

  // Entirely non-mission aisles → hide card
  if (
    cartL0s.length > 0 &&
    cartL0s.every((l0) => SUPPRESS_L0.has(l0))
  ) {
    return {
      need_id: "suppress",
      label: "Hidden",
      confidence: 0,
      mission: "",
      why_lines: ["", ""],
      cart_l0s: cartL0s,
      mode: "suppress",
      target_l0s: [],
    };
  }

  const hasMedicine =
    l0Set.has("health-pharma") ||
    /crocin|moov|band-aid|thermometer|ors-electral|electral|vicks/.test(t);

  const ids = new Set(basket.map((b) => b.productId));
  const hasPackagedWater =
    ids.has("kinley-water") ||
    /\bkinley\b|\bbisleri\b|packaged water|mineral water/.test(t);

  // Recovery: pharma + optional water
  if (hasMedicine && (hasPackagedWater || primary === "health-pharma")) {
    const recoveryTargets = [
      "drinks-juices",
      "vegetables-fruits",
      "dry-fruits-cereals",
    ].filter((l0) => !l0Set.has(l0));
    const targets =
      recoveryTargets.length > 0
        ? recoveryTargets
        : novelComplementTargets(cartL0s);
    return {
      need_id: "recovery",
      label: "Recovery",
      confidence: 0.86,
      mission: "Finish this recovery run in one trip",
      why_lines: [
        `Your cart is ${cartLabelList(cartL0s) || "health & pharma"}`,
        targets[0]
          ? `${labelL0(targets[0])} often finishes a recovery run`
          : "A missing aisle often finishes a recovery run",
      ],
      cart_l0s: cartL0s,
      mode: "complement",
      target_l0s: targets,
    };
  }

  if (hasPackagedWater && basket.length <= 2 && !l0Set.has("chips-namkeen")) {
    const hydrationTargets = [
      "drinks-juices",
      "dry-fruits-cereals",
      "vegetables-fruits",
    ].filter((l0) => !l0Set.has(l0));
    const targets =
      hydrationTargets.length > 0
        ? hydrationTargets
        : novelComplementTargets(cartL0s);
    return {
      need_id: "hydration",
      label: "Hydration",
      confidence: 0.72,
      mission: "Go beyond plain water this trip",
      why_lines: [
        "Your cart is mostly packaged water",
        targets[0]
          ? `${labelL0(targets[0])} usually finishes a hydration run`
          : "A better drink often gets ordered later the same night",
      ],
      cart_l0s: cartL0s,
      mode: "complement",
      target_l0s: targets,
    };
  }

  if (isBreakfastCombo(l0Set, t)) {
    const breakfastTargets = [
      "vegetables-fruits",
      "dry-fruits-cereals",
      "sauces-spreads",
    ].filter((l0) => !l0Set.has(l0));
    const targets =
      breakfastTargets.length > 0
        ? breakfastTargets
        : novelComplementTargets(cartL0s);
    return {
      need_id: "breakfast",
      label: "Breakfast",
      confidence: 0.91,
      mission: "Finish this breakfast in one trip",
      why_lines: [
        `Your cart already covers ${cartLabelList(cartL0s)}`,
        targets[0]
          ? `${labelL0(targets[0])} is the usual missing piece for breakfast`
          : "Fruit or yogurt is the usual missing piece for breakfast",
      ],
      cart_l0s: cartL0s,
      mode: "complement",
      target_l0s: targets,
    };
  }

  if (isHostingCombo(l0Set)) {
    const hostingTargets = [
      "kitchenware-appliances",
      "paan-corner",
      "sweets-chocolates",
    ].filter((l0) => !l0Set.has(l0));
    return {
      need_id: "hosting",
      label: "Hosting",
      confidence: 0.9,
      mission: "Finish hosting without another store run",
      why_lines: [
        "Chips plus a cold drink usually means people are gathering",
        "Paper plates finish the hosting run — you skip a second order",
      ],
      cart_l0s: cartL0s,
      mode: "complement",
      target_l0s:
        hostingTargets.length > 0
          ? hostingTargets
          : novelComplementTargets(cartL0s),
    };
  }

  // Sensitive: only when the cart is entirely that aisle (never cross into grocery)
  const sensitiveOnly =
    cartL0s.length > 0 && cartL0s.every((l0) => SAME_AISLE_ONLY.has(l0));
  if (sensitiveOnly) {
    const aisle = primary;
    return {
      need_id: "same_aisle",
      label: labelL0(aisle),
      confidence: 0.88,
      mission: `Complete this ${labelL0(aisle).toLowerCase()} run`,
      why_lines: [
        `Your cart is ${labelL0(aisle)}`,
        "A matching item from the same aisle finishes this trip",
      ],
      cart_l0s: cartL0s,
      mode: "same_aisle",
      target_l0s: [aisle],
    };
  }

  // CER default: complements outside L0s already in the cart
  const novelTargets = novelComplementTargets(cartL0s);

  // Mixed carts (2+ L0s) — never collapse to same-aisle pet/baby filler
  if (cartL0s.length >= 2 && novelTargets.length > 0) {
    return {
      need_id: "aisle",
      label: "This trip",
      confidence: 0.84,
      mission: "Add a category still missing from this trip",
      why_lines: [
        `Your cart spans ${cartLabelList(cartL0s)}`,
        `${labelL0(novelTargets[0]!)} isn't in this cart yet — finish the run`,
      ],
      cart_l0s: cartL0s,
      mode: "complement",
      target_l0s: novelTargets,
    };
  }

  if (primary === "pet-care" && novelTargets.length > 0) {
    return {
      need_id: "pet",
      label: "Pet care",
      confidence: 0.86,
      mission: "Add what usually pairs with a pet run",
      why_lines: [
        "Your cart is Pet care",
        `${labelL0(novelTargets[0]!)} is a category this trip usually skips`,
      ],
      cart_l0s: cartL0s,
      mode: "complement",
      target_l0s: novelTargets,
    };
  }

  if (primary === "baby-care" && novelTargets.length > 0) {
    return {
      need_id: "baby",
      label: "Baby care",
      confidence: 0.86,
      mission: "Add what usually pairs with a baby run",
      why_lines: [
        "Your cart is Baby care",
        `${labelL0(novelTargets[0]!)} often gets left for a second order`,
      ],
      cart_l0s: cartL0s,
      mode: "complement",
      target_l0s: novelTargets,
    };
  }

  if (
    primary === "skin-face" ||
    primary === "bath-body" ||
    primary === "hair-care" ||
    primary === "beauty-cosmetics"
  ) {
    const targets =
      novelTargets.length > 0
        ? novelTargets
        : (COMPLEMENT_L0[primary] ?? ["bath-body"]).filter(
            (l0) => !l0Set.has(l0),
          );
    return {
      need_id: "selfcare",
      label: "Self-care",
      confidence: 0.84,
      mission: "Finish personal care without a second trip",
      why_lines: [
        `Your cart is ${cartLabelList(cartL0s)}`,
        `${labelL0(targets[0] ?? "bath-body")} usually pairs with this run`,
      ],
      cart_l0s: cartL0s,
      mode: "complement",
      target_l0s: targets.length ? targets : ["bath-body"],
    };
  }

  if (
    primary === "atta-rice-dal" ||
    primary === "oil-ghee-masala" ||
    (l0Set.has("atta-rice-dal") && l0Set.has("oil-ghee-masala"))
  ) {
    return {
      need_id: "staples",
      label: "Home staples",
      confidence: 0.82,
      mission: "Round out this pantry restock",
      why_lines: [
        `Your cart is ${cartLabelList(cartL0s)}`,
        "Veg or a cooking essential often finishes a staples run",
      ],
      cart_l0s: cartL0s,
      mode: "complement",
      target_l0s: COMPLEMENT_L0[primary] ?? [
        "vegetables-fruits",
        "oil-ghee-masala",
      ],
    };
  }

  if (
    primary === "chips-namkeen" ||
    primary === "sweets-chocolates" ||
    primary === "bakery-biscuits"
  ) {
    const snackTargets = (COMPLEMENT_L0[primary] ?? ["drinks-juices"]).filter(
      (l0) => !l0Set.has(l0),
    );
    if (snackTargets.length === 0) {
      const fallback = novelComplementTargets(cartL0s);
      if (fallback.length === 0) {
        return {
          need_id: "suppress",
          label: "Hidden",
          confidence: 0,
          mission: "",
          why_lines: ["", ""],
          cart_l0s: cartL0s,
          mode: "suppress",
          target_l0s: [],
        };
      }
      return {
        need_id: "snacking",
        label: "Snacking",
        confidence: 0.75,
        mission: "Make this snack run more complete",
        why_lines: [
          `Your cart is ${cartLabelList(cartL0s)}`,
          `${labelL0(fallback[0]!)} isn't in this cart yet`,
        ],
        cart_l0s: cartL0s,
        mode: "complement",
        target_l0s: fallback,
      };
    }
    return {
      need_id: "snacking",
      label: "Snacking",
      confidence: 0.8,
      mission: "Make this snack run more complete",
      why_lines: [
        `Your cart is ${cartLabelList(cartL0s)}`,
        `${labelL0(snackTargets[0]!)} usually finishes a snack run`,
      ],
      cart_l0s: cartL0s,
      mode: "complement",
      target_l0s: snackTargets,
    };
  }

  // Default: L0 affinity — always prefer L0s not already in the cart (CER)
  if (novelTargets.length > 0) {
    return {
      need_id: "aisle",
      label: labelL0(primary) || "This trip",
      confidence: 0.78,
      mission: `Finish this ${labelL0(primary).toLowerCase()} run`,
      why_lines: [
        `Your cart is ${cartLabelList(cartL0s)}`,
        `${labelL0(novelTargets[0]!)} isn't in this cart yet — finish the run`,
      ],
      cart_l0s: cartL0s,
      mode: "complement",
      target_l0s: novelTargets,
    };
  }

  // Last resort (should be rare): hide rather than same-aisle filler for CER aisles
  return {
    need_id: "suppress",
    label: "Hidden",
    confidence: 0,
    mission: "",
    why_lines: ["", ""],
    cart_l0s: cartL0s,
    mode: "suppress",
    target_l0s: [],
  };
}

export function inStockId(id: string) {
  return getCatalogProduct(id)?.inStock !== false;
}

export const HIGH_CONSIDERATION_IDS = new Set(["water-purifier"]);

export function filterByConfidence(
  ids: string[],
  confidence: number,
): string[] {
  return ids.filter((id) => {
    if (HIGH_CONSIDERATION_IDS.has(id) && confidence < 0.85) return false;
    return inStockId(id);
  });
}

export function getSolutionIds(needId: NeedId): string[] {
  const g = NEED_GRAPHS[needId];
  if (!g) return [];
  return [...g.completionIds, ...g.similarIds];
}

/** Catalog SKUs in given L0s, scored for trial (rating + discovery tag). */
export function catalogIdsForL0s(
  targetL0s: string[],
  cart: Set<string>,
  limit = 24,
): string[] {
  const catalog = getCatalog();
  const want = new Set(targetL0s);
  const scored: { id: string; score: number; order: number }[] = [];

  for (const p of catalog.products) {
    if (!p.inStock || cart.has(p.id)) continue;
    const l0 = getProductL0(p.id);
    if (!l0 || !want.has(l0)) continue;
    const order = targetL0s.indexOf(l0);
    let score = (p.rating ?? 4) * 10;
    score += Math.min((p.ratingCount ?? 0) / 2000, 8);
    if (p.tags?.includes("discovery")) score += 12;
    // Prefer cheaper trial packs slightly
    if (p.price <= 80) score += 4;
    else if (p.price <= 150) score += 2;
    scored.push({ id: p.id, score: score - order * 3, order });
  }

  scored.sort(
    (a, b) => b.score - a.score || a.order - b.order || a.id.localeCompare(b.id),
  );
  return scored.slice(0, limit).map((s) => s.id);
}
