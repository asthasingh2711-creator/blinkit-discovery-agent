import { buildDiscoverResponseSchema } from "@/lib/discover-schema";
import {
  DEMO_STORE_ID,
  DISCOVERY_AGENT_SYSTEM_PROMPT,
} from "@/lib/discovery-system-prompt";
import type {
  DiscoverRequest,
  DiscoverResponse,
  ExplanationSlots,
} from "@/lib/discover-types";
import { getHabitualL0s, isNovelCategory } from "@/lib/novelty";
import { rankWithRules } from "@/lib/rules-ranker";

const GEMINI_MODEL = "gemini-2.0-flash";

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : trimmed;
  return JSON.parse(raw);
}

/** Templated copy only — never use model-generated text in the UI. */
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

function mapCandidates(
  ids: string[],
  req: DiscoverRequest,
  habitual: string[],
) {
  const byId = Object.fromEntries(req.candidates.map((c) => [c.id, c]));
  return ids.map((id) => {
    const c = byId[id];
    return {
      id,
      title: c?.title ?? id,
      name: c?.name ?? id,
      category: c?.category ?? "",
      unit: c?.unit ?? "",
      in_stock: Boolean(c?.in_stock && req.store_stock[id] !== false),
      rating: c?.rating ?? 4,
      rating_count: c?.rating_count ?? 0,
      price: c?.price ?? 0,
      never_purchased: Boolean(c?.never_purchased),
      novel_vs_habitual: isNovelCategory(id, new Set(habitual)),
    };
  });
}

function buildUserPayload(req: DiscoverRequest) {
  const recently_rejected = req.recently_rejected ?? req.exclude_ids ?? [];
  const habitual = [...getHabitualL0s(req.basket)];
  const similar =
    req.similar_candidate_ids?.length > 0
      ? req.similar_candidate_ids
      : req.need_candidate_ids;
  const completion =
    req.completion_candidate_ids?.length > 0
      ? req.completion_candidate_ids
      : req.need_candidate_ids;

  return {
    store_id: req.store_id ?? DEMO_STORE_ID,
    basket: req.basket,
    inferred_need: {
      need_id: req.inferred_need.need_id,
      label: req.inferred_need.label,
      confidence: req.inferred_need.confidence,
    },
    habitual_category_l0s: habitual,
    user_category_history_gaps: req.user_category_history_gaps ?? [],
    urgency: {
      score: req.urgency.score,
      reasons: req.urgency.reasons,
    },
    recently_rejected,
    similar_candidates: mapCandidates(similar, req, habitual),
    completion_candidates: mapCandidates(completion, req, habitual),
    instruction:
      "Rank using EVERY basket line. Return up to 6 completion_ids (best-first) from DIFFERENT Blinkit L0 aisles than any cart item (unless same-aisle-only candidates). Prefer mission fit, then novel aisle, then rating. Return ONLY similar_ids and completion_ids — no explanation text.",
  };
}

function padRail(
  picked: string[],
  pool: string[],
  rejected: Set<string>,
  other: Set<string>,
  n: number,
): string[] {
  const out = [...picked];
  for (const id of pool) {
    if (out.length >= n) break;
    if (rejected.has(id) || other.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out.slice(0, n);
}

function validateResponse(
  data: unknown,
  req: DiscoverRequest,
): DiscoverResponse | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  const similarAllowed = new Set(
    req.similar_candidate_ids?.length
      ? req.similar_candidate_ids
      : req.need_candidate_ids,
  );
  const completionAllowed = new Set(
    req.completion_candidate_ids?.length
      ? req.completion_candidate_ids
      : req.need_candidate_ids,
  );
  const rejected = new Set(req.recently_rejected ?? req.exclude_ids ?? []);

  let similar_ids: string[] = [];
  if (Array.isArray(obj.similar_ids)) {
    similar_ids = obj.similar_ids.filter(
      (id): id is string =>
        typeof id === "string" &&
        similarAllowed.has(id) &&
        !rejected.has(id),
    );
  }
  similar_ids = [...new Set(similar_ids)].slice(0, 3);
  similar_ids = padRail(
    similar_ids,
    [...similarAllowed],
    rejected,
    new Set(),
    3,
  );

  let completion_ids: string[] = [];
  if (Array.isArray(obj.completion_ids)) {
    completion_ids = obj.completion_ids.filter(
      (id): id is string =>
        typeof id === "string" &&
        completionAllowed.has(id) &&
        !rejected.has(id) &&
        !similar_ids.includes(id),
    );
  }
  completion_ids = [...new Set(completion_ids)].slice(0, 6);
  completion_ids = padRail(
    completion_ids,
    [...completionAllowed],
    rejected,
    new Set(similar_ids),
    6,
  );

  if (similar_ids.length === 0 && completion_ids.length === 0) return null;

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
    chosen_id: completion_ids[0] ?? similar_ids[0]!,
    picks,
    // Always templated from rules inference — ignore any model text
    explanation_slots: slotsFromNeed(req),
    reject_ids: [...similarAllowed, ...completionAllowed].filter(
      (id) => !similar_ids.includes(id) && !completion_ids.includes(id),
    ),
    source: "gemini",
  };
}

export async function rankWithGemini(
  req: DiscoverRequest,
): Promise<DiscoverResponse | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const similar =
    req.similar_candidate_ids?.length > 0
      ? req.similar_candidate_ids
      : req.need_candidate_ids;
  const completion =
    req.completion_candidate_ids?.length > 0
      ? req.completion_candidate_ids
      : req.need_candidate_ids;
  if (similar.length === 0 && completion.length === 0) return null;

  const schema = buildDiscoverResponseSchema(similar, completion);
  const userPayload = buildUserPayload(req);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: DISCOVERY_AGENT_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Rank candidates. Return JSON with similar_ids + completion_ids only.\n\nINPUT:\n${JSON.stringify(userPayload, null, 2)}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty text");

  return validateResponse(extractJson(text), req);
}

export async function rankDiscover(
  req: DiscoverRequest,
): Promise<DiscoverResponse> {
  const wantGemini = Boolean(
    process.env.GEMINI_API_KEY && req.useGemini !== false,
  );

  if (wantGemini) {
    try {
      const gemini = await rankWithGemini(req);
      if (
        gemini &&
        (gemini.similar_ids.length >= 1 || gemini.completion_ids.length >= 1)
      ) {
        return gemini;
      }
    } catch {
      // fall through
    }
  }

  return rankWithRules(req);
}
