import type { UrgencyReason } from "@/lib/urgency";
import type { NeedId } from "@/lib/needs";

export type DiscoverBasketItem = {
  productId: string;
  name: string;
  qty: number;
  category?: string;
};

export type DiscoverCandidateInput = {
  id: string;
  title: string;
  name: string;
  category: string;
  unit: string;
  in_stock: boolean;
  rating: number;
  rating_count: number;
  price: number;
  never_purchased?: boolean;
  rail?: "similar" | "completion";
};

export type DiscoverRequest = {
  basket: DiscoverBasketItem[];
  urgency: {
    score: number;
    reasons: UrgencyReason[];
  };
  candidates: DiscoverCandidateInput[];
  /** Section 1 candidates — similar purchase, cross-category */
  similar_candidate_ids: string[];
  /** Section 3 candidates — complementary / completion, cross-category */
  completion_candidate_ids: string[];
  /** @deprecated union of both rails */
  need_candidate_ids: string[];
  complementary_candidate_ids: string[];
  inferred_need: {
    need_id: NeedId;
    label: string;
    confidence: number;
    mission: string;
    why_lines: string[];
  };
  store_stock: Record<string, boolean>;
  store_id?: string;
  user_category_history_gaps?: string[];
  useGemini?: boolean;
  exclude_ids?: string[];
  recently_rejected?: string[];
};

export type ExplanationSlots = {
  mission: string;
  bridge: string;
  why_lines: string[];
};

export type DiscoverPick = {
  id: string;
  role: "primary" | "alternative";
  rail: "similar" | "completion";
};

export type DiscoverResponse = {
  need_id: NeedId;
  need_label: string;
  confidence: number;
  /** Section 1 — 3 similar cross-category */
  similar_ids: string[];
  /** Section 3 — 3 completion / complementary cross-category */
  completion_ids: string[];
  /** @deprecated = completion_ids */
  need_solution_ids: string[];
  complementary_id: string | null;
  chosen_id: string;
  picks: DiscoverPick[];
  explanation_slots: ExplanationSlots;
  reject_ids: string[];
  source: "rules" | "gemini";
};
