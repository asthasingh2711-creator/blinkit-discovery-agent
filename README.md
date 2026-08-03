# NL Blinkit — Discovery Agent

Slide 8 MVP: checkout Discovery card — novel-category suggestions + Why.

**Live prototype:** [https://discovery-agent-prototype.vercel.app](https://discovery-agent-prototype.vercel.app)  
**App source:** [`discovery-agent-prototype/`](./discovery-agent-prototype/)

```bash
cd discovery-agent-prototype
npm i && npm run dev
```

Open [http://localhost:3000/cart](http://localhost:3000/cart).

Set `GEMINI_API_KEY` locally (`.env.local`) or on Vercel for AI ranking (rules fail-soft otherwise).

Prototype uses a **seeded ~90-day purchase history** for demo — not live account data.
