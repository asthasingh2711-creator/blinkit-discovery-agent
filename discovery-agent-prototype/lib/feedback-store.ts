export type FeedbackAction =
  | "accepted"
  | "show_another"
  | "not_interested"
  | "not_urgent";

export type FeedbackEvent = {
  id: string;
  productId: string;
  action: FeedbackAction;
  ts: string;
};

const MAX = 80;
const events: FeedbackEvent[] = [];

export function pushFeedback(
  event: Omit<FeedbackEvent, "id">,
): FeedbackEvent {
  const full: FeedbackEvent = {
    ...event,
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
  events.unshift(full);
  if (events.length > MAX) events.length = MAX;
  console.info("[discovery-feedback]", JSON.stringify(full));
  return full;
}

export function listFeedback(limit = 20): FeedbackEvent[] {
  return events.slice(0, limit);
}
