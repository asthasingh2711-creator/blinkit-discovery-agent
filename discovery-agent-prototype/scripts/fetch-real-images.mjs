/**
 * Fetch real photography for category tiles + hero product packs.
 * Saves under public/catalog/categories|products and updates catalog JSON.
 *
 * Run: node scripts/fetch-real-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CATALOG_PATH = path.join(ROOT, "data", "blinkit-catalog.json");
const CAT_DIR = path.join(ROOT, "public", "catalog", "categories");
const PROD_DIR = path.join(ROOT, "public", "catalog", "products");

function fetchBuffer(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          "User-Agent": "BlinkitDiscoveryMVP/1.0 (fellowship demo; offline cache)",
          Accept: "image/*,application/json,*/*",
        },
      },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirects < 6
        ) {
          const next = new URL(res.headers.location, url).href;
          res.resume();
          fetchBuffer(next, redirects + 1).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.setTimeout(25000, () => req.destroy(new Error("timeout")));
  });
}

async function fetchJson(url) {
  const buf = await fetchBuffer(url);
  return JSON.parse(buf.toString("utf8"));
}

async function saveImage(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) return true;
  const buf = await fetchBuffer(url);
  if (buf.length < 800) throw new Error("tiny image");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return true;
}

/** Curated Unsplash stills — grocery / aisle vibe (cached locally). */
const CATEGORY_PHOTOS = {
  "bath-body":
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&h=400&q=80",
  "hair-care":
    "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=400&h=400&q=80",
  "skin-face":
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&h=400&q=80",
  "beauty-cosmetics":
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&h=400&q=80",
  "feminine-hygiene":
    "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=400&h=400&q=80",
  "baby-care":
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=400&h=400&q=80",
  "health-pharma":
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&h=400&q=80",
  "sexual-wellness":
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&h=400&q=80",
  "vegetables-fruits":
    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&h=400&q=80",
  "atta-rice-dal":
    "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&h=400&q=80",
  "oil-ghee-masala":
    "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&h=400&q=80",
  "dairy-bread-eggs":
    "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=400&h=400&q=80",
  "bakery-biscuits":
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&h=400&q=80",
  "dry-fruits-cereals":
    "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=400&h=400&q=80",
  "chicken-meat-fish":
    "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&h=400&q=80",
  "kitchenware-appliances":
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&h=400&q=80",
  "chips-namkeen":
    "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&h=400&q=80",
  "sweets-chocolates":
    "https://images.unsplash.com/photo-1548907040-4d2be3ed3175?auto=format&fit=crop&w=400&h=400&q=80",
  "drinks-juices":
    "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=400&h=400&q=80",
  "tea-coffee":
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&h=400&q=80",
  "instant-food":
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&h=400&q=80",
  "sauces-spreads":
    "https://images.unsplash.com/photo-1472476443507-0957c9e857a8?auto=format&fit=crop&w=400&h=400&q=80",
  "paan-corner":
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=400&q=80",
  "ice-creams":
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&h=400&q=80",
  "home-lifestyle":
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&h=400&q=80",
  "cleaners-repellents":
    "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=400&h=400&q=80",
  electronics:
    "https://images.unsplash.com/photo-1498049794561-7780e723bc1f?auto=format&fit=crop&w=400&h=400&q=80",
  "stationery-games":
    "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=400&h=400&q=80",
  "pet-care":
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=400&h=400&q=80",
  stores:
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&h=400&q=80",
  "e-cards":
    "https://images.unsplash.com/photo-1513201099705-a9746e1e051f?auto=format&fit=crop&w=400&h=400&q=80",
};

/**
 * Hero SKUs → Open Food Facts search terms (real packaging when available).
 * Fallback: curated Unsplash product-style photos.
 */
const HERO_OFF = {
  "amul-taaza-1l": "Amul Taaza milk",
  "britannia-bread": "Britannia bread",
  "farm-eggs-6": "eggs carton",
  "mother-dairy-curd": "Mother Dairy curd",
  "epigamia-greek-yogurt": "Epigamia yogurt",
  "amul-butter": "Amul butter",
  "nestle-aplus": "Nestle a+ milk",
  banana: "banana fruit",
  "apple-shimla": "red apple",
  "fresh-fruit-cup": "fruit cup",
  onion: "onion",
  tomato: "tomato",
  "saffola-oats": "Saffola oats",
  "kelloggs-cornflakes": "Kelloggs corn flakes",
  "peanut-butter": "peanut butter jar",
  "chia-seeds": "chia seeds",
  "california-almonds": "almonds pack",
  "lays-classic": "Lays classic",
  "lays-magic": "Lays magic masala",
  kurkure: "Kurkure",
  oreo: "Oreo cookies",
  "parle-g": "Parle G",
  "cadbury-dairy-milk": "Cadbury Dairy Milk",
  kitkat: "KitKat",
  "coca-cola": "Coca Cola bottle",
  sprite: "Sprite bottle",
  maaza: "Maaza mango",
  "real-juice": "Real juice",
  "coconut-water": "coconut water",
  "kinley-water": "Kinley water",
  maggi: "Maggi noodles",
  yippee: "Yippee noodles",
  "tata-gold": "Tata tea",
  "tata-salt": "Tata salt",
  "fortune-oil": "Fortune oil",
  "toor-dal": "toor dal",
  "india-gate-basmati": "basmati rice",
  "mdh-garam": "MDH garam masala",
  "surf-excel": "Surf Excel",
  "dettol-soap": "Dettol soap",
  "colgate-strong": "Colgate toothpaste",
  "himalaya-facewash": "Himalaya face wash",
  crocin: "Crocin",
  "vicks-vaporub": "Vicks VapoRub",
  "ors-electral": "ORS Electral",
  "digital-thermometer": "digital thermometer",
  "paper-plates": "paper plates",
  "paper-cups": "paper cups",
  "center-fresh": "Center Fresh gum",
  pampers: "Pampers diapers",
  huggies: "Huggies diapers",
  cerelac: "Cerelac",
  "johnson-baby": "Johnson baby soap",
  pedigree: "Pedigree dog food",
  whiskas: "Whiskas",
  "me-o": "Me-O cat food",
  "dog-treats": "dog treats",
  "tick-shampoo": "pet shampoo",
  "puppy-pads": "puppy pads",
};

const HERO_FALLBACK_PHOTO = {
  "amul-taaza-1l":
    "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&h=400&q=80",
  "britannia-bread":
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&h=400&q=80",
  "farm-eggs-6":
    "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&h=400&q=80",
  banana:
    "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&h=400&q=80",
  "apple-shimla":
    "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&h=400&q=80",
  onion:
    "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?auto=format&fit=crop&w=400&h=400&q=80",
  tomato:
    "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=400&h=400&q=80",
  "coca-cola":
    "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=400&h=400&q=80",
  oreo:
    "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&h=400&q=80",
  maggi:
    "https://images.unsplash.com/photo-1612929636598-ec4e401ba9ed?auto=format&fit=crop&w=400&h=400&q=80",
  "lays-classic":
    "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&h=400&q=80",
  "peanut-butter":
    "https://images.unsplash.com/photo-1505576399279-565b52d4acb1?auto=format&fit=crop&w=400&h=400&q=80",
  "kelloggs-cornflakes":
    "https://images.unsplash.com/photo-1521483451569-e33803c0330c?auto=format&fit=crop&w=400&h=400&q=80",
  "saffola-oats":
    "https://images.unsplash.com/photo-1517673400267-07543917e1b6?auto=format&fit=crop&w=400&h=400&q=80",
  "paper-plates":
    "https://images.unsplash.com/photo-1608198093002-ad4e505484ba?auto=format&fit=crop&w=400&h=400&q=80",
  pedigree:
    "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&h=400&q=80",
  default:
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&h=400&q=80",
};

async function offImageUrl(query) {
  const url =
    "https://world.openfoodfacts.org/cgi/search.pl?" +
    new URLSearchParams({
      search_terms: query,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "8",
      fields: "code,product_name,image_front_url,image_url,brands",
    }).toString();
  const data = await fetchJson(url);
  const products = data.products || [];
  for (const p of products) {
    const img = p.image_front_url || p.image_url;
    if (img && /^https?:\/\//.test(img)) return img;
  }
  return null;
}

async function downloadCategories(catalog) {
  fs.mkdirSync(CAT_DIR, { recursive: true });
  for (const [id, url] of Object.entries(CATEGORY_PHOTOS)) {
    const dest = path.join(CAT_DIR, `${id}.jpg`);
    process.stdout.write(`cat ${id}… `);
    try {
      await saveImage(url, dest);
      console.log("ok");
    } catch (e) {
      console.log("fail", e.message);
    }
  }
  for (const c of catalog.categories) {
    if (c.parent) continue;
    const file = `/catalog/categories/${c.id}.jpg`;
    if (fs.existsSync(path.join(ROOT, "public", file.slice(1)))) {
      c.image = file;
    }
  }
}

async function downloadHeroes(catalog) {
  fs.mkdirSync(PROD_DIR, { recursive: true });
  const byId = new Map(catalog.products.map((p) => [p.id, p]));

  for (const [id, query] of Object.entries(HERO_OFF)) {
    const p = byId.get(id);
    if (!p) continue;
    const destJpg = path.join(PROD_DIR, `${id}.jpg`);
    process.stdout.write(`sku ${id}… `);
    let ok = false;
    try {
      if (!(fs.existsSync(destJpg) && fs.statSync(destJpg).size > 2000)) {
        let imgUrl = null;
        try {
          imgUrl = await offImageUrl(query);
        } catch {
          imgUrl = null;
        }
        if (!imgUrl) {
          imgUrl =
            HERO_FALLBACK_PHOTO[id] || HERO_FALLBACK_PHOTO.default;
        }
        await saveImage(imgUrl, destJpg);
      }
      p.image = `/catalog/products/${id}.jpg`;
      p.packColor = "#FFFFFF";
      ok = true;
      console.log("ok");
    } catch (e) {
      console.log("fail", e.message);
      // keep existing svg if any
    }
    if (!ok && HERO_FALLBACK_PHOTO[id]) {
      try {
        await saveImage(HERO_FALLBACK_PHOTO[id], destJpg);
        p.image = `/catalog/products/${id}.jpg`;
        p.packColor = "#FFFFFF";
        console.log("  fallback ok");
      } catch {
        /* ignore */
      }
    }
    await new Promise((r) => setTimeout(r, 350));
  }
}

/**
 * Non-heroes keep unique /catalog/products/{id}.svg packshots.
 * Never reuse one aisle JPG across a whole grid (looks broken).
 */
function keepUniquePackshots(catalog) {
  for (const p of catalog.products) {
    if (p.image && p.image.endsWith(".jpg") && p.image.includes("/products/")) {
      p.packColor = "#FFFFFF";
      continue;
    }
    p.image = `/catalog/products/${p.id}.svg`;
    p.packColor = "#FFFFFF";
  }
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  console.log("=== Category photos ===");
  await downloadCategories(catalog);
  console.log("=== Hero product packs (Open Food Facts → Unsplash fallback) ===");
  await downloadHeroes(catalog);
  keepUniquePackshots(catalog);
  catalog.meta.real_images_at = new Date().toISOString();
  catalog.meta.note =
    "Real category photos + hero pack shots cached locally. Non-heroes use aisle photo.";
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + "\n");
  const jpgHero = catalog.products.filter((p) =>
    p.image?.includes("/products/") && p.image.endsWith(".jpg"),
  ).length;
  console.log(`Done. Hero JPGs wired: ${jpgHero}. Catalog updated.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
