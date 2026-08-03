import type {
  DiscoverRequest,
  DiscoverResponse,
  ExplanationSlots,
} from "@/lib/discover-types";
import { getHabitualL0s, isNovelCategory } from "@/lib/novelty";

function pickTop(
  pool: string[],
  req: DiscoverRequest,
  rejected: Set<string>,
  taken: Set<string>,
  n: number,
): string[] {
  const habitual = getHabitualL0s(req.basket);
  const stockOk = (id: string) =>
    req.store_stock[id] !== false &&
    req.candidates.find((c) => c.id === id)?.in_stock !== false;

  const scored = pool
    .filter((id) => !rejected.has(id) && !taken.has(id) && stockOk(id))
    .map((id) => {
      const c = req.candidates.find((x) => x.id === id);
      let score = 0;
      if (isNovelCategory(id, habitual)) score += 40;
      if (c?.never_purchased) score += 20;
      score += (c?.rating ?? 4) * 5;
      score += Math.min((c?.rating_count ?? 0) / 1000, 8);
      score += Math.max(0, 10 - pool.indexOf(id));
      return { id, score };
    });

  scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return scored.slice(0, n).map((s) => s.id);
}

/**
 * Rules: 3 similar + 3 completion, no overlap, cross-category pools already filtered.
 */
export function rankWithRules(req: DiscoverRequest): DiscoverResponse {
  const rejected = new Set(req.recently_rejected ?? req.exclude_ids ?? []);
  const similarPool =
    req.similar_candidate_ids?.length > 0
      ? req.similar_candidate_ids
      : req.need_candidate_ids;
  const completionPool =
    req.completion_candidate_ids?.length > 0
      ? req.completion_candidate_ids
      : req.complementary_candidate_ids?.length
        ? req.complementary_candidate_ids
        : req.need_candidate_ids;

  const similar_ids = pickTop(similarPool, req, rejected, new Set(), 3);
  const taken = new Set(similar_ids);
  const completion_ids = pickTop(
    completionPool,
    req,
    rejected,
    taken,
    6,
  );

  const chosen_id =
    completion_ids[0] ?? similar_ids[0] ?? req.candidates[0]?.id ?? "sprite";

  const picks = [
    ...similar_ids.map((id, i) => ({
      id,
      role: (i === 0 ? "primary" : "alternative") as "primary" | "alternative",
      rail: "similar" as const,
    })),
    ...completion_ids.map((id, i) => ({
      id,
      role: (i === 0 ? "primary" : "alternative") as "primary" | "alternative",
      rail: "completion" as const,
    })),
  ];

  return {
    need_id: req.inferred_need.need_id,
    need_label: req.inferred_need.label,
    confidence: req.inferred_need.confidence,
    similar_ids,
    completion_ids,
    need_solution_ids: completion_ids,
    complementary_id: completion_ids[0] ?? null,
    chosen_id,
    picks,
    explanation_slots: slotsFromNeed(req),
    reject_ids: [...similarPool, ...completionPool].filter(
      (id) => !similar_ids.includes(id) && !completion_ids.includes(id),
    ),
    source: "rules",
  };
}

function slotsFromNeed(req: DiscoverRequest): ExplanationSlots {
  const n = req.inferred_need;
  return {
    mission: clipWords(n.mission, 10),
    bridge: clipWords(
      `One new-category pick that helps finish ${n.label.toLowerCase()}`,
      18,
    ),
    why_lines: n.why_lines.map((l) => clipWords(l, 16)).slice(0, 2),
  };
}

function clipWords(text: string, max: number): string {
  return text.trim().split(/\s+/).filter(Boolean).slice(0, max).join(" ");
}
