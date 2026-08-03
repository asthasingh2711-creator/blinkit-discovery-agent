import { NextResponse } from "next/server";
import {
  listFeedback,
  pushFeedback,
  type FeedbackAction,
} from "@/lib/feedback-store";

export const runtime = "nodejs";

const ACTIONS = new Set<FeedbackAction>([
  "accepted",
  "show_another",
  "not_interested",
  "not_urgent",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      action?: string;
      ts?: string;
    };

    if (
      !body.productId ||
      !body.action ||
      !ACTIONS.has(body.action as FeedbackAction)
    ) {
      return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
    }

    const event = pushFeedback({
      productId: body.productId,
      action: body.action as FeedbackAction,
      ts: body.ts ?? new Date().toISOString(),
    });

    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: "Feedback failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    40,
    Math.max(1, Number(searchParams.get("limit") ?? "20") || 20),
  );
  return NextResponse.json({ events: listFeedback(limit) });
}
