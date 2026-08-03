/**
 * Attempt to refresh data/blinkit-catalog.json from Blinkit public endpoints.
 * Cloudflare often blocks datacenter IPs — on failure we keep the snapshot.
 *
 * Usage: npm run scrape:blinkit
 */

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../data/blinkit-catalog.json");
const LAT = "28.4595";
const LON = "77.0266";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-IN,en;q=0.9",
  app_client: "consumer_web",
  lat: LAT,
  lon: LON,
  Referer: "https://blinkit.com/",
  Origin: "https://blinkit.com",
};

async function tryFetch(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, redirect: "follow" });
    const text = await res.text();
    const isJson = text.trim().startsWith("{") || text.trim().startsWith("[");
    return {
      ok: res.ok && isJson,
      status: res.status,
      json: isJson ? JSON.parse(text) : null,
      snippet: text.slice(0, 120),
    };
  } catch (e) {
    return { ok: false, status: 0, json: null, snippet: String(e) };
  }
}

async function main() {
  console.log("Scraping Blinkit catalog endpoints…");

  const endpoints = [
    `https://api2.grofers.com/v1/layout/listing_widgets?l0_cat=14&l1_cat=922`,
    `https://blinkit.com/v1/layout/listing_widgets?l0_cat=14&l1_cat=922`,
    `https://api2.grofers.com/v1/layout/search?q=milk`,
  ];

  let live = null;
  for (const url of endpoints) {
    process.stdout.write(`  → ${url.slice(0, 70)}… `);
    const result = await tryFetch(url);
    console.log(result.ok ? "OK" : `blocked (${result.status})`);
    if (result.ok) {
      live = { url, data: result.json };
      break;
    }
  }

  if (!live) {
    console.log(
      "\nLive scrape blocked (Cloudflare). Keeping existing snapshot at data/blinkit-catalog.json",
    );
    if (existsSync(OUT)) {
      const existing = JSON.parse(readFileSync(OUT, "utf8"));
      existing.meta = {
        ...existing.meta,
        last_scrape_attempt: new Date().toISOString(),
        last_scrape_status: "blocked_cloudflare",
        note: "Live scrape blocked by Cloudflare. Snapshot taxonomy mirrors Blinkit India. Retry from a residential IP or wire an approved data partner.",
      };
      writeFileSync(OUT, JSON.stringify(existing, null, 2) + "\n");
      console.log(
        `Updated meta on snapshot (${existing.categories.length} categories, ${existing.products.length} products).`,
      );
    }
    process.exit(0);
  }

  // If a future live payload succeeds, merge conservatively into snapshot shape.
  console.log("Live payload received — merge adapter not fully mapped yet.");
  console.log("Write a mapper for this response shape before overwriting snapshot.");
  writeFileSync(
    resolve(__dirname, "../data/blinkit-live-raw.json"),
    JSON.stringify({ fetched_at: new Date().toISOString(), ...live }, null, 2),
  );
  console.log("Saved raw response to data/blinkit-live-raw.json");
}

main();
