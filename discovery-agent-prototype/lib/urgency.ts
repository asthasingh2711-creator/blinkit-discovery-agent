/**
 * Rules-only urgency_intent scorer (no LLM).
 * Threshold τ = 0.65 — used later to gate Discovery card.
 */

export const URGENCY_THRESHOLD = 0.65;

export type UrgencyLevel = "low" | "medium" | "high";

export type UrgencyFeatures = {
  /** 0–1: mission/search lexicon match (e.g. breakfast staples, "milk") */
  lexicon: number;
  /** Delivery ETA in minutes */
  etaMinutes: number;
  /** Session length in minutes (search → cart) */
  sessionMinutes: number;
  /** Distinct SKUs / line items in basket */
  basketSize: number;
  /** 0–1: share of cart that looks like buy-again / reorder staples */
  buyAgainShare: number;
  /** Evening window (after ~6pm local) */
  isEvening: boolean;
  /** Search-heavy path into cart (many queries / PLP hops) */
  searchHeavy: boolean;
};

export type UrgencyReason = {
  id: string;
  label: string;
};

export type UrgencyResult = {
  score: number;
  reasons: UrgencyReason[];
  aboveThreshold: boolean;
};

/** Preset feature vectors for demo controls */
export const URGENCY_PRESETS: Record<UrgencyLevel, UrgencyFeatures> = {
  high: {
    lexicon: 0.9,
    etaMinutes: 9,
    sessionMinutes: 1.5,
    basketSize: 3,
    buyAgainShare: 0.15,
    isEvening: true,
    searchHeavy: true,
  },
  medium: {
    lexicon: 0.55,
    etaMinutes: 14,
    sessionMinutes: 4,
    basketSize: 5,
    buyAgainShare: 0.4,
    isEvening: false,
    searchHeavy: true,
  },
  low: {
    lexicon: 0.2,
    etaMinutes: 22,
    sessionMinutes: 12,
    basketSize: 9,
    buyAgainShare: 0.85,
    isEvening: false,
    searchHeavy: false,
  },
};

const WEIGHTS = {
  lexicon: 0.22,
  etaFast: 0.24,
  shortSession: 0.2,
  smallBasket: 0.18,
  evening: 0.12,
  searchHeavy: 0.14,
  buyAgainDampener: 0.28,
} as const;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function roundScore(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Weighted rules → urgency_intent score in [0, 1] plus human-readable reasons.
 */
export function computeUrgencyIntent(features: UrgencyFeatures): UrgencyResult {
  const reasons: UrgencyReason[] = [];
  let raw = 0;

  const lexiconContribution = clamp01(features.lexicon) * WEIGHTS.lexicon;
  raw += lexiconContribution;
  if (features.lexicon >= 0.5) {
    reasons.push({
      id: "lexicon",
      label: "You're on a quick staples run",
    });
  }

  const etaFast = features.etaMinutes <= 10 ? 1 : features.etaMinutes <= 15 ? 0.45 : 0;
  raw += etaFast * WEIGHTS.etaFast;
  if (etaFast >= 0.45) {
    reasons.push({
      id: "eta_fast",
      label: `Delivery in about ${features.etaMinutes} minutes`,
    });
  }

  const shortSession =
    features.sessionMinutes <= 2 ? 1 : features.sessionMinutes <= 5 ? 0.5 : 0;
  raw += shortSession * WEIGHTS.shortSession;
  if (shortSession >= 0.5) {
    reasons.push({
      id: "short_session",
      label: "You moved to checkout quickly",
    });
  }

  const smallBasket =
    features.basketSize <= 3 ? 1 : features.basketSize <= 5 ? 0.55 : 0;
  raw += smallBasket * WEIGHTS.smallBasket;
  if (smallBasket >= 0.55) {
    reasons.push({
      id: "small_basket",
      label: "A small basket for right now",
    });
  }

  if (features.isEvening) {
    raw += WEIGHTS.evening;
    reasons.push({
      id: "evening",
      label: "Evening order — finishing up for the day",
    });
  }

  if (features.searchHeavy) {
    raw += WEIGHTS.searchHeavy;
    reasons.push({
      id: "search_heavy",
      label: "You searched for what you needed, then checked out",
    });
  }

  const dampener =
    clamp01(features.buyAgainShare) * WEIGHTS.buyAgainDampener;
  raw -= dampener;
  if (features.buyAgainShare >= 0.6) {
    reasons.push({
      id: "buy_again_heavy",
      label: "Mostly restocking usual items",
    });
  }

  // Normalize against theoretical max positive weight sum
  const maxPositive =
    WEIGHTS.lexicon +
    WEIGHTS.etaFast +
    WEIGHTS.shortSession +
    WEIGHTS.smallBasket +
    WEIGHTS.evening +
    WEIGHTS.searchHeavy;

  const score = roundScore(clamp01(raw / maxPositive));

  if (reasons.length === 0) {
    reasons.push({
      id: "baseline",
      label: "A more relaxed browsing-style trip",
    });
  }

  return {
    score,
    reasons,
    aboveThreshold: score >= URGENCY_THRESHOLD,
  };
}

export function levelFromScore(score: number): UrgencyLevel {
  if (score >= URGENCY_THRESHOLD) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}
