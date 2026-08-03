import { NextResponse } from "next/server";
import type { DiscoverRequest } from "@/lib/discover-types";
import { rankDiscover } from "@/lib/gemini-ranker";
import { rankWithRules } from "@/lib/rules-ranker";

export const runtime = "nodejs";

function isDiscoverRequest(body: unknown): body is DiscoverRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    Array.isArray(b.basket) &&
    Array.isArray(b.candidates) &&
    typeof b.inferred_need === "object" &&
    b.inferred_need !== null &&
    typeof b.urgency === "object" &&
    b.urgency !== null &&
    typeof b.store_stock === "object" &&
    b.store_stock !== null
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isDiscoverRequest(body)) {
      return NextResponse.json(
        { error: "Invalid discover payload" },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.similar_candidate_ids)) {
      body.similar_candidate_ids = body.need_candidate_ids ?? [];
    }
    if (!Array.isArray(body.completion_candidate_ids)) {
      body.completion_candidate_ids =
        body.complementary_candidate_ids ?? body.need_candidate_ids ?? [];
    }
    if (!Array.isArray(body.need_candidate_ids)) {
      body.need_candidate_ids = [
        ...body.similar_candidate_ids,
        ...body.completion_candidate_ids,
      ];
    }
    if (!Array.isArray(body.complementary_candidate_ids)) {
      body.complementary_candidate_ids = body.completion_candidate_ids;
    }

    if (
      body.similar_candidate_ids.length === 0 &&
      body.completion_candidate_ids.length === 0 &&
      body.candidates.length === 0
    ) {
      return NextResponse.json({ error: "No candidates" }, { status: 400 });
    }

    const result = await rankDiscover(body);
    return NextResponse.json(result);
  } catch {
    const fallback = rankWithRules({
      basket: [
        { productId: "lays-classic", name: "Lays", qty: 1 },
        { productId: "kurkure", name: "Kurkure", qty: 1 },
      ],
      urgency: { score: 0.9, reasons: [] },
      candidates: [
        {
          id: "oreo",
          title: "Oreo",
          name: "Oreo",
          category: "sweets",
          unit: "1",
          in_stock: true,
          rating: 4.4,
          rating_count: 1000,
          price: 30,
          never_purchased: true,
          rail: "similar",
        },
        {
          id: "parle-g",
          title: "Parle-G",
          name: "Parle-G",
          category: "sweets",
          unit: "1",
          in_stock: true,
          rating: 4.5,
          rating_count: 2000,
          price: 10,
          never_purchased: true,
          rail: "similar",
        },
        {
          id: "real-juice",
          title: "Juice",
          name: "Real Juice",
          category: "drinks",
          unit: "1 L",
          in_stock: true,
          rating: 4.2,
          rating_count: 800,
          price: 110,
          never_purchased: true,
          rail: "similar",
        },
        {
          id: "sprite",
          title: "Sprite",
          name: "Sprite",
          category: "drinks",
          unit: "750 ml",
          in_stock: true,
          rating: 4.3,
          rating_count: 1500,
          price: 40,
          never_purchased: true,
          rail: "completion",
        },
        {
          id: "paper-plates",
          title: "Plates",
          name: "Paper Plates",
          category: "home",
          unit: "10",
          in_stock: true,
          rating: 4.1,
          rating_count: 400,
          price: 45,
          never_purchased: true,
          rail: "completion",
        },
        {
          id: "center-fresh",
          title: "Mint",
          name: "Center Fresh",
          category: "sweets",
          unit: "1",
          in_stock: true,
          rating: 4.0,
          rating_count: 300,
          price: 10,
          never_purchased: true,
          rail: "completion",
        },
      ],
      similar_candidate_ids: ["oreo", "parle-g", "real-juice"],
      completion_candidate_ids: ["sprite", "paper-plates", "center-fresh"],
      need_candidate_ids: [
        "oreo",
        "parle-g",
        "real-juice",
        "sprite",
        "paper-plates",
        "center-fresh",
      ],
      complementary_candidate_ids: ["sprite", "paper-plates", "center-fresh"],
      inferred_need: {
        need_id: "snacking",
        label: "Snacking",
        confidence: 0.78,
        mission: "Make this snack run more complete",
        why_lines: [
          "A chip-heavy cart is a snacking mission in progress",
          "Drinks or a different snack aisle usually get bought next",
        ],
      },
      store_stock: {
        oreo: true,
        "parle-g": true,
        "real-juice": true,
        sprite: true,
        "paper-plates": true,
        "center-fresh": true,
      },
      useGemini: false,
    });
    return NextResponse.json(fallback);
  }
}

export async function GET() {
  return NextResponse.json({
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
}
