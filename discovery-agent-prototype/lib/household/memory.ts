/**
 * Seeded purchase history for the demo shopper.
 * Never rendered as a UI panel — only enriches ranking/copy via outcomes.ts.
 */
export type PurchaseHistoryItem = {
  productId: string;
  name: string;
  frequency: number;
  lastBought: string;
};

export type InferredUsecase = {
  id: string;
  label: string;
  confidence: number;
  evidence: string;
};

export type LifecycleEvent = {
  id: string;
  label: string;
  inferredFrom: string;
  since: string;
};

export type HouseholdMemory = {
  id: string;
  title: string;
  summary: string;
  purchase_history: PurchaseHistoryItem[];
  inferred_usecases: InferredUsecase[];
  lifecycle_events: LifecycleEvent[];
  seasonality_note?: string;
};

export const HOUSEHOLD_MEMORIES: Record<string, HouseholdMemory> = {
  breakfast_household: {
    id: "breakfast_household",
    title: "Breakfast pattern",
    summary:
      "Repeated milk, bread, eggs, and cereal — breakfast routine with a yogurt gap.",
    purchase_history: [
      {
        productId: "amul-taaza-1l",
        name: "Amul Taaza Milk",
        frequency: 18,
        lastBought: "2 days ago",
      },
      {
        productId: "britannia-bread",
        name: "Whole Wheat Bread",
        frequency: 14,
        lastBought: "3 days ago",
      },
      {
        productId: "farm-eggs-6",
        name: "Farm Fresh Eggs",
        frequency: 12,
        lastBought: "4 days ago",
      },
      {
        productId: "kelloggs-cornflakes",
        name: "Corn Flakes",
        frequency: 6,
        lastBought: "1 week ago",
      },
    ],
    inferred_usecases: [
      {
        id: "breakfast_routine",
        label: "Weekday breakfast",
        confidence: 0.91,
        evidence: "Milk, bread, eggs and cereal over several weeks",
      },
    ],
    lifecycle_events: [],
    seasonality_note: "School-morning rush window",
  },

  wellness_household: {
    id: "wellness_household",
    title: "Wellness pattern",
    summary: "Occasional fever meds + hydration.",
    purchase_history: [
      {
        productId: "crocin",
        name: "Crocin Advance",
        frequency: 3,
        lastBought: "6 weeks ago",
      },
      {
        productId: "kinley-water",
        name: "Packaged water",
        frequency: 8,
        lastBought: "1 week ago",
      },
    ],
    inferred_usecases: [
      {
        id: "wellness_recovery",
        label: "Recovery care",
        confidence: 0.78,
        evidence: "Medicine and water together on late-night carts",
      },
    ],
    lifecycle_events: [
      {
        id: "seasonal_flu",
        label: "Seasonal wellness",
        inferredFrom: "Repeat OTC + hydration",
        since: "This season",
      },
    ],
  },

  /**
   * Seeded ~90-day history for the thesis demo shopper:
   * habitual chips + soft drinks; Kitchenware / disposables never purchased.
   */
  hosting_household: {
    id: "hosting_household",
    title: "Hosting pattern",
    summary:
      "Repeated snacks and cold drinks over ~90 days — no disposables or kitchenware.",
    purchase_history: [
      {
        productId: "lays-magic",
        name: "Lay's chips",
        frequency: 11,
        lastBought: "5 days ago",
      },
      {
        productId: "kurkure",
        name: "Kurkure",
        frequency: 8,
        lastBought: "1 week ago",
      },
      {
        productId: "sprite",
        name: "Sprite",
        frequency: 12,
        lastBought: "yesterday",
      },
      {
        productId: "coca-cola",
        name: "Coca-Cola",
        frequency: 7,
        lastBought: "9 days ago",
      },
      {
        productId: "oreo",
        name: "Oreo",
        frequency: 5,
        lastBought: "2 weeks ago",
      },
    ],
    inferred_usecases: [
      {
        id: "party_hosting",
        label: "Hosting / snack runs",
        confidence: 0.86,
        evidence:
          "Chips and cold drinks repeatedly; kitchenware never in 90-day history",
      },
    ],
    lifecycle_events: [],
  },
};

export function getHouseholdMemory(id: string): HouseholdMemory | undefined {
  return HOUSEHOLD_MEMORIES[id];
}
