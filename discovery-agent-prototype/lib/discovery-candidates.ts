import {
  formatRatingCount,
  getCatalogProduct,
  getDiscoverySeedProducts,
} from "@/lib/catalog";

export type DiscoveryCandidate = {
  productId: string;
  /** Fallback only — UI prefers outcome headline from ranker */
  title: string;
  rating: number;
  ratingsCountLabel: string;
  returnWindow: string;
  savings: number;
  valueChip?: string;
  affinityLines: [string, string];
  explanationTemplate: string;
};

const EXTRA_IDS = [
  "fresh-fruit-cup",
  "banana",
  "apple-shimla",
  "chia-seeds",
  "colgate-strong",
  "dove-soap",
  "california-almonds",
  "paper-plates",
  "paper-cups",
  "mixed-dry-fruits",
  "coconut-water",
  "ors-electral",
  "electrolyte-powder",
];

function toCandidate(p: {
  id: string;
  name: string;
  rating: number;
  ratingCount: number;
  returnWindow: string;
  savings?: number;
  valueChip?: string;
  discoveryTitle?: string;
  affinityLines?: [string, string];
}): DiscoveryCandidate {
  return {
    productId: p.id,
    title: p.discoveryTitle ?? p.name,
    rating: p.rating,
    ratingsCountLabel: formatRatingCount(p.ratingCount),
    returnWindow: p.returnWindow,
    savings: p.savings ?? 0,
    valueChip: p.valueChip,
    affinityLines: p.affinityLines ?? [
      "Pairs with items already in your cart",
      "A common add-on for this trip",
    ],
    explanationTemplate: `${p.name} is suggested because it fits what's in your cart and what you tend to buy on trips like this.`,
  };
}

const seed = getDiscoverySeedProducts().map(toCandidate);
const extras = EXTRA_IDS.map((id) => getCatalogProduct(id))
  .filter(Boolean)
  .map((p) => toCandidate(p!))
  .filter((c) => !seed.some((s) => s.productId === c.productId));

export const DISCOVERY_CANDIDATES: DiscoveryCandidate[] = [...seed, ...extras];
