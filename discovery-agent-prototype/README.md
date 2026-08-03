# Blinkit Discovery Agent — Prototype

**Part 4 MVP (Slide 8)** — one cart/checkout inline Discovery card, once per session:

- **One suggestion** — complementary pick from a **novel Blinkit L0**
- **Why this?** — templated explanation + ★ / ratings / return window
- **Show another** · **Not now** / add → cycles ranked alts or ends the session

**AI scope:** Gemini ranks candidate ids only (fail-soft to rules). Customer copy is always rules/templates from the cart’s L0 mission — no free-form model claims.

**Coverage:** All 31 Blinkit L0 aisles use affinity maps. Sensitive aisles (sexual wellness, feminine hygiene) finish **same-aisle only**. Stores/e-cards hide the card. Cart capped at **10 distinct lines**.

Default demo cart: chips + namkeen + soft drink → **paper plates** (Kitchenware).

Novelty (“category you don’t usually buy”) is scored against a **seeded ~90-day purchase history** for the demo household — not live account data. Disclose that in the deck footnote.

## Reviewer path

1. Open [https://discovery-agent-prototype.vercel.app/cart](https://discovery-agent-prototype.vercel.app/cart)
2. See the single **Based on your cart** card (e.g. Paper Plates · New: Kitchenware)
3. Tap **Why this?** → customer copy + trust cues; scroll to **PM reasoning** textbox (marked not for customers)
4. Try **Show another** · **Not now** · or Add (once/session)

## Run / deploy

```bash
cd discovery-agent-prototype
npm i && npm run dev
npx vercel --prod
```

Set `GEMINI_API_KEY` on Vercel for AI ranking (rules fail-soft otherwise).
