/**
 * L0 aisle affinity — covers every Blinkit L0 in the demo catalog.
 * Complements are 1-hop mission finishes, not random grocery filler.
 */

export const L0_LABELS: Record<string, string> = {
  "vegetables-fruits": "Fruits & veg",
  "dairy-bread-eggs": "Dairy, bread & eggs",
  "dry-fruits-cereals": "Cereals & dry fruits",
  "chips-namkeen": "Chips & namkeen",
  "sweets-chocolates": "Sweets & chocolates",
  "bakery-biscuits": "Bakery & biscuits",
  "drinks-juices": "Drinks & juices",
  "instant-food": "Instant food",
  "sauces-spreads": "Sauces & spreads",
  "atta-rice-dal": "Atta, rice & dal",
  "oil-ghee-masala": "Oil, ghee & masala",
  "tea-coffee": "Tea & coffee",
  "chicken-meat-fish": "Chicken, meat & fish",
  "ice-creams": "Ice cream",
  "kitchenware-appliances": "Kitchenware",
  "health-pharma": "Health & pharma",
  "bath-body": "Bath & body",
  "skin-face": "Skin & face",
  "hair-care": "Hair care",
  "beauty-cosmetics": "Beauty",
  "feminine-hygiene": "Feminine hygiene",
  "sexual-wellness": "Sexual wellness",
  "baby-care": "Baby care",
  "pet-care": "Pet care",
  "cleaners-repellents": "Cleaners",
  "home-lifestyle": "Home & lifestyle",
  "electronics": "Electronics",
  "stationery-games": "Stationery & games",
  "paan-corner": "Paan corner",
  stores: "Stores",
  "e-cards": "E-cards",
};

/** Finish inside the same aisle (never cross into grocery). */
export const SAME_AISLE_ONLY = new Set([
  "sexual-wellness",
  "feminine-hygiene",
]);

/** No Discovery card — not a trip-finish mission. */
export const SUPPRESS_L0 = new Set(["stores", "e-cards"]);

/**
 * Complementary L0s (best-first) for cross-aisle finish.
 * First entry is the preferred “solves this trip” aisle.
 */
export const COMPLEMENT_L0: Record<string, string[]> = {
  "chips-namkeen": [
    "drinks-juices",
    "kitchenware-appliances",
    "paan-corner",
    "sweets-chocolates",
    "bakery-biscuits",
  ],
  "drinks-juices": [
    "chips-namkeen",
    "kitchenware-appliances",
    "paan-corner",
    "ice-creams",
    "sweets-chocolates",
  ],
  "bakery-biscuits": [
    "drinks-juices",
    "dairy-bread-eggs",
    "sweets-chocolates",
    "tea-coffee",
  ],
  "sweets-chocolates": [
    "drinks-juices",
    "bakery-biscuits",
    "ice-creams",
    "chips-namkeen",
  ],
  "ice-creams": ["sweets-chocolates", "drinks-juices", "bakery-biscuits"],
  "dairy-bread-eggs": [
    "vegetables-fruits",
    "dry-fruits-cereals",
    "sauces-spreads",
    "tea-coffee",
  ],
  "vegetables-fruits": [
    "dairy-bread-eggs",
    "oil-ghee-masala",
    "sauces-spreads",
    "atta-rice-dal",
  ],
  "dry-fruits-cereals": [
    "dairy-bread-eggs",
    "vegetables-fruits",
    "sauces-spreads",
    "tea-coffee",
  ],
  "sauces-spreads": [
    "dairy-bread-eggs",
    "bakery-biscuits",
    "vegetables-fruits",
    "chips-namkeen",
  ],
  "atta-rice-dal": [
    "oil-ghee-masala",
    "vegetables-fruits",
    "chicken-meat-fish",
    "sauces-spreads",
  ],
  "oil-ghee-masala": [
    "atta-rice-dal",
    "vegetables-fruits",
    "chicken-meat-fish",
    "dairy-bread-eggs",
  ],
  "tea-coffee": [
    "dairy-bread-eggs",
    "bakery-biscuits",
    "dry-fruits-cereals",
    "sweets-chocolates",
  ],
  "instant-food": [
    "vegetables-fruits",
    "sauces-spreads",
    "drinks-juices",
    "dairy-bread-eggs",
  ],
  "chicken-meat-fish": [
    "vegetables-fruits",
    "oil-ghee-masala",
    "sauces-spreads",
    "atta-rice-dal",
  ],
  "kitchenware-appliances": [
    "chips-namkeen",
    "drinks-juices",
    "cleaners-repellents",
    "home-lifestyle",
  ],
  "health-pharma": [
    "drinks-juices",
    "vegetables-fruits",
    "dry-fruits-cereals",
    "bath-body",
  ],
  "bath-body": ["skin-face", "hair-care", "health-pharma"],
  "skin-face": ["bath-body", "hair-care", "beauty-cosmetics"],
  "hair-care": ["bath-body", "skin-face", "beauty-cosmetics"],
  "beauty-cosmetics": ["skin-face", "hair-care", "bath-body"],
  /** CER: novel adjacent aisles — never more pet-care when pet is already in cart */
  "baby-care": ["health-pharma", "dairy-bread-eggs", "bath-body"],
  "pet-care": ["cleaners-repellents", "home-lifestyle", "dairy-bread-eggs"],
  "cleaners-repellents": [
    "bath-body",
    "home-lifestyle",
    "kitchenware-appliances",
  ],
  "home-lifestyle": [
    "cleaners-repellents",
    "kitchenware-appliances",
    "stationery-games",
  ],
  "electronics": ["home-lifestyle", "stationery-games"],
  "stationery-games": ["electronics", "home-lifestyle"],
  "paan-corner": ["drinks-juices", "chips-namkeen", "sweets-chocolates"],
  "sexual-wellness": ["sexual-wellness"],
  "feminine-hygiene": ["feminine-hygiene"],
  stores: [],
  "e-cards": [],
};

/** Soft fallbacks when every complement L0 is already in the cart */
export const FALLBACK_NOVEL_L0 = [
  "drinks-juices",
  "kitchenware-appliances",
  "paan-corner",
  "tea-coffee",
  "cleaners-repellents",
  "ice-creams",
  "sauces-spreads",
] as const;

export function labelL0(l0: string): string {
  return L0_LABELS[l0] ?? l0.replace(/-/g, " ");
}

/** Complements for cart L0s that are not already in the cart (vote-scored). */
export function novelComplementTargets(cartL0s: string[]): string[] {
  const inCart = new Set(cartL0s);
  const scores = new Map<string, number>();

  for (const l0 of cartL0s) {
    if (SAME_AISLE_ONLY.has(l0) || SUPPRESS_L0.has(l0)) continue;
    const list = COMPLEMENT_L0[l0] ?? [];
    list.forEach((t, i) => {
      if (
        SUPPRESS_L0.has(t) ||
        SAME_AISLE_ONLY.has(t) ||
        inCart.has(t)
      ) {
        return;
      }
      // Earlier complements score higher; multiple cart L0s voting boosts relevance
      scores.set(t, (scores.get(t) ?? 0) + Math.max(1, 12 - i));
    });
  }

  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([l0]) => l0);

  if (ranked.length > 0) return ranked;

  for (const t of FALLBACK_NOVEL_L0) {
    if (!inCart.has(t)) ranked.push(t);
  }
  return ranked;
}

/** Prefer hosting disposables when snacks + drinks co-occur (thesis cart). */
export function isHostingCombo(l0s: Set<string>): boolean {
  return l0s.has("chips-namkeen") && l0s.has("drinks-juices");
}

/** Classic breakfast staples combo. */
export function isBreakfastCombo(l0s: Set<string>, names: string): boolean {
  if (!l0s.has("dairy-bread-eggs")) return false;
  const hasBread = /\bbread\b/.test(names);
  const hasEgg = /\begg/.test(names);
  const hasMilk = /\bmilk\b|taaza|a\+/.test(names);
  return [hasBread, hasEgg, hasMilk].filter(Boolean).length >= 2;
}
