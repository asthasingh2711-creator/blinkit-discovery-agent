/** Gemini schema: ranked product ids only — no free-form customer copy. */
export function buildDiscoverResponseSchema(
  similarIds: string[],
  completionIds: string[],
) {
  const similarEnum = similarIds.length > 0 ? similarIds : ["oreo"];
  const completionEnum =
    completionIds.length > 0 ? completionIds : ["sprite"];

  return {
    type: "object",
    properties: {
      similar_ids: {
        type: "array",
        description:
          "Exactly 3 ids from similar_candidates when available. Same-intent, different categories vs cart. Best-first.",
        minItems: 1,
        maxItems: 3,
        items: { type: "string", enum: similarEnum },
      },
      completion_ids: {
        type: "array",
        description:
          "Up to 6 ids from completion_candidates when available (best-first). Complementary / trip completion, different categories. No overlap with similar_ids.",
        minItems: 1,
        maxItems: 6,
        items: { type: "string", enum: completionEnum },
      },
    },
    required: ["similar_ids", "completion_ids"],
  } as const;
}
