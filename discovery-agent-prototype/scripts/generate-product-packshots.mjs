/**
 * Unique pack-shot per SKU → public/catalog/products/{id}.svg
 * Updates data/blinkit-catalog.json image paths.
 *
 * Run: node scripts/generate-product-packshots.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CATALOG = path.join(ROOT, "data", "blinkit-catalog.json");
const OUT_DIR = path.join(ROOT, "public", "catalog", "products");

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hsl(h, s, l) {
  return `hsl(${h % 360} ${s}% ${l}%)`;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapWords(text, maxLen, maxLines) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxLen && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    } else {
      cur = next;
    }
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

/** Pack silhouette by aisle */
function shapeFor(l0, name) {
  const n = `${l0} ${name}`.toLowerCase();
  if (/fruit|vegetable|banana|apple|onion|tomato|coriander/.test(n) && /vegetables-fruits/.test(l0))
    return "produce";
  if (/drink|juice|soda|water|milk|lassi|cola|sprite|maaza|coconut|tea|coffee/.test(n) ||
      ["drinks-juices", "tea-coffee"].includes(l0))
    return "bottle";
  if (/chip|namkeen|kurkure|lays|biscuit|cookie|oreo|parle|snack|popcorn/.test(n) ||
      ["chips-namkeen", "bakery-biscuits"].includes(l0))
    return "pouch";
  if (/chocolate|candy|gum|sweet|kitkat|dairy milk/.test(n) || l0 === "sweets-chocolates")
    return "bar";
  if (/yogurt|curd|butter|cheese|ice|tub|cream/.test(n) ||
      ["ice-creams"].includes(l0))
    return "tub";
  if (/oil|ghee|sauce|ketchup|honey|jam|pickle|spread|peanut/.test(n) ||
      ["oil-ghee-masala", "sauces-spreads"].includes(l0))
    return "jar";
  if (/soap|shampoo|lotion|face|serum|cream|detergent|cleaner|pharma|medicine|ors|crocin|vicks/.test(n) ||
      ["bath-body", "hair-care", "skin-face", "beauty-cosmetics", "health-pharma", "cleaners-repellents"].includes(l0))
    return "carton";
  if (/atta|rice|dal|cereal|oats|flour|pet|food|diaper|powder/.test(n) ||
      ["atta-rice-dal", "dry-fruits-cereals", "pet-care", "baby-care", "instant-food"].includes(l0))
    return "box";
  if (/plate|cup|bottle|kitchen|electronic|phone|book|pen/.test(n) ||
      ["kitchenware-appliances", "electronics", "stationery-games", "home-lifestyle"].includes(l0))
    return "box";
  return "carton";
}

function packGeometry(shape, accent, light, dark) {
  switch (shape) {
    case "bottle":
      return `
        <rect x="118" y="36" width="84" height="28" rx="8" fill="${accent}"/>
        <rect x="128" y="58" width="64" height="18" fill="${dark}"/>
        <path d="M96 88 h128 a16 16 0 0 1 16 16 v168 a20 20 0 0 1 -20 20 H100 a20 20 0 0 1 -20 -20 V104 a16 16 0 0 1 16 -16 z" fill="${light}" stroke="${dark}" stroke-width="2"/>
        <rect x="110" y="120" width="100" height="90" rx="8" fill="#fff" opacity="0.92"/>
      `;
    case "pouch":
      return `
        <path d="M78 70 c0 -18 24 -28 82 -28 s82 10 82 28 v200 c0 22 -24 34 -82 34 s-82 -12 -82 -34 z" fill="${light}" stroke="${dark}" stroke-width="2"/>
        <path d="M90 78 h140 v36 H90 z" fill="${accent}"/>
        <ellipse cx="160" cy="56" rx="22" ry="10" fill="${dark}"/>
        <rect x="100" y="130" width="120" height="100" rx="10" fill="#fff" opacity="0.94"/>
      `;
    case "jar":
      return `
        <rect x="112" y="40" width="96" height="24" rx="6" fill="${dark}"/>
        <rect x="104" y="60" width="112" height="16" fill="${accent}"/>
        <path d="M88 84 h144 a12 12 0 0 1 12 12 v168 a18 18 0 0 1 -18 18 H94 a18 18 0 0 1 -18 -18 V96 a12 12 0 0 1 12 -12 z" fill="${light}" stroke="${dark}" stroke-width="2"/>
        <rect x="108" y="130" width="104" height="90" rx="8" fill="#fff" opacity="0.93"/>
      `;
    case "tub":
      return `
        <ellipse cx="160" cy="70" rx="90" ry="28" fill="${accent}"/>
        <path d="M70 70 v150 a20 20 0 0 0 20 20 h160 a20 20 0 0 0 20 -20 V70" fill="${light}" stroke="${dark}" stroke-width="2"/>
        <ellipse cx="160" cy="70" rx="90" ry="28" fill="none" stroke="${dark}" stroke-width="2"/>
        <rect x="100" y="120" width="120" height="90" rx="10" fill="#fff" opacity="0.94"/>
      `;
    case "bar":
      return `
        <rect x="48" y="100" width="224" height="130" rx="18" fill="${accent}" stroke="${dark}" stroke-width="2"/>
        <rect x="64" y="118" width="192" height="94" rx="12" fill="${light}"/>
        <rect x="78" y="130" width="164" height="70" rx="8" fill="#fff" opacity="0.95"/>
      `;
    case "produce":
      return `
        <circle cx="160" cy="150" r="108" fill="${light}" stroke="${dark}" stroke-width="3"/>
        <circle cx="160" cy="150" r="88" fill="${accent}" opacity="0.35"/>
        <rect x="90" y="200" width="140" height="52" rx="12" fill="#fff" opacity="0.95"/>
      `;
    case "box":
      return `
        <path d="M70 78 h180 l20 28 v170 a12 12 0 0 1 -12 12 H62 a12 12 0 0 1 -12 -12 V106 z" fill="${light}" stroke="${dark}" stroke-width="2"/>
        <path d="M70 78 l20 -22 h180 l-20 22 z" fill="${accent}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="92" y="120" width="136" height="110" rx="8" fill="#fff" opacity="0.94"/>
      `;
    default: // carton
      return `
        <rect x="86" y="48" width="148" height="232" rx="14" fill="${light}" stroke="${dark}" stroke-width="2"/>
        <rect x="86" y="48" width="148" height="44" rx="14" fill="${accent}"/>
        <rect x="86" y="78" width="148" height="14" fill="${dark}" opacity="0.85"/>
        <rect x="104" y="120" width="112" height="110" rx="8" fill="#fff" opacity="0.94"/>
      `;
  }
}

function labelY(shape) {
  if (shape === "bar") return 152;
  if (shape === "produce") return 218;
  return 148;
}

/** Recognisable brand / SKU accents (India Q-comm staples) */
const BRAND_LOOK = {
  amul: { accent: "#2680C2", light: "#E8F4FC", dark: "#0B4F86" },
  britannia: { accent: "#E31C23", light: "#FFF0F0", dark: "#8B1014" },
  "lay's": { accent: "#F5C518", light: "#FFF8D6", dark: "#8A6A00" },
  lays: { accent: "#F5C518", light: "#FFF8D6", dark: "#8A6A00" },
  kurkure: { accent: "#E85D04", light: "#FFE8D6", dark: "#7A2E00" },
  parle: { accent: "#F4A261", light: "#FFF4E8", dark: "#9A4E00" },
  cadbury: { accent: "#4A148C", light: "#F3E5F5", dark: "#2E0854" },
  "coca-cola": { accent: "#E61A27", light: "#FFE8EA", dark: "#7A0C12" },
  sprite: { accent: "#00A651", light: "#E5F8EC", dark: "#006633" },
  maaza: { accent: "#F77F00", light: "#FFF0E0", dark: "#9A4A00" },
  real: { accent: "#C1121F", light: "#FFE8EA", dark: "#6A0A10" },
  maggi: { accent: "#E85D04", light: "#FFEDE0", dark: "#7A2E00" },
  nestlé: { accent: "#6C3B2A", light: "#F5EBE6", dark: "#3E2116" },
  nestle: { accent: "#6C3B2A", light: "#F5EBE6", dark: "#3E2116" },
  dettol: { accent: "#007A3D", light: "#E5F5EC", dark: "#004D26" },
  colgate: { accent: "#E31C23", light: "#FFE8E8", dark: "#8B1014" },
  himalaya: { accent: "#2D6A4F", light: "#E8F5EE", dark: "#1B4332" },
  saffola: { accent: "#E9C46A", light: "#FFF8E8", dark: "#7A5C10" },
  "kellogg's": { accent: "#E31C23", light: "#FFF0F0", dark: "#8B1014" },
  kelloggs: { accent: "#E31C23", light: "#FFF0F0", dark: "#8B1014" },
  epigamia: { accent: "#2A9D8F", light: "#E6F7F4", dark: "#0F5C54" },
  pedigree: { accent: "#F4A261", light: "#FFF4E8", dark: "#9A4E00" },
  crocin: { accent: "#E31C23", light: "#FFE8E8", dark: "#8B1014" },
  vicks: { accent: "#1D3557", light: "#E8EEF5", dark: "#0D1B2A" },
  tata: { accent: "#0033A0", light: "#E8EEFF", dark: "#001F66" },
  fortune: { accent: "#E9C46A", light: "#FFF8E8", dark: "#7A5C10" },
  "surf excel": { accent: "#0077B6", light: "#E5F4FB", dark: "#023E8A" },
  pampers: { accent: "#00B4D8", light: "#E5F8FC", dark: "#0077A3" },
  huggies: { accent: "#F72585", light: "#FFE5F1", dark: "#9A0850" },
  kinley: { accent: "#0077B6", light: "#E5F4FB", dark: "#023E8A" },
  electral: { accent: "#E31C23", light: "#FFE8E8", dark: "#8B1014" },
  "center fresh": { accent: "#2D6A4F", light: "#E8F5EE", dark: "#1B4332" },
  oreo: { accent: "#1A1A1A", light: "#F0F0F0", dark: "#000000" },
  kitkat: { accent: "#E31C23", light: "#FFE8E8", dark: "#8B1014" },
  freshco: { accent: "#40916C", light: "#E8F5EE", dark: "#1B4332" },
  blinkselect: { accent: "#0A9D3C", light: "#E8F8EE", dark: "#065F24" },
};

function lookFor(product) {
  const brand = (product.brand || "").toLowerCase();
  const id = (product.id || "").toLowerCase();
  for (const [key, look] of Object.entries(BRAND_LOOK)) {
    if (brand.includes(key) || id.includes(key.replace(/\s+/g, "-"))) return look;
  }
  return null;
}

function generateSvg(product, l0) {
  const h = hash(product.id);
  const hue = h % 360;
  const hue2 = (hue + 40 + (h % 80)) % 360;
  const branded = lookFor(product);
  const accent = branded?.accent || hsl(hue, 62, 46);
  const light = branded?.light || hsl(hue2, 48, 92);
  const dark = branded?.dark || hsl(hue, 40, 28);
  const bg1 = hsl((hue + 180) % 360, 25, 96);
  const bg2 = hsl(hue2, 30, 90);
  const shape = shapeFor(l0, product.name);
  const brand = esc((product.brand || "Blinkit").slice(0, 18));
  const nameLines = wrapWords(product.name.replace(product.brand || "", "").trim() || product.name, 16, 3);
  const unit = esc(product.unit || "");
  const emoji = product.emoji || "🛒";
  const price = product.price != null ? `₹${product.price}` : "";
  const ly = labelY(shape);
  const patternId = `p-${product.id.replace(/[^a-z0-9]/gi, "")}`;

  const nameTspans = nameLines
    .map(
      (line, i) =>
        `<tspan x="160" dy="${i === 0 ? 0 : 14}">${esc(line)}</tspan>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320" role="img" aria-label="${esc(product.name)}">
  <defs>
    <linearGradient id="bg-${patternId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <pattern id="dot-${patternId}" width="12" height="12" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.2" fill="${accent}" opacity="0.12"/>
    </pattern>
  </defs>
  <rect width="320" height="320" fill="url(#bg-${patternId})"/>
  <rect width="320" height="320" fill="url(#dot-${patternId})"/>
  ${packGeometry(shape, accent, light, dark)}
  <text x="160" y="${shape === "produce" ? 145 : 108}" text-anchor="middle" font-size="${shape === "produce" ? 64 : 28}">${emoji}</text>
  <text x="160" y="${ly}" text-anchor="middle" font-family="ui-rounded, system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="${dark}" letter-spacing="0.04em">${brand.toUpperCase()}</text>
  <text x="160" y="${ly + 18}" text-anchor="middle" font-family="ui-rounded, system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#1a1a1a">${nameTspans}</text>
  <text x="160" y="${ly + 18 + nameLines.length * 14 + 6}" text-anchor="middle" font-family="ui-rounded, system-ui, -apple-system, sans-serif" font-size="10" font-weight="600" fill="#666">${unit}${price ? " · " + price : ""}</text>
  <rect x="12" y="12" width="44" height="18" rx="4" fill="${accent}"/>
  <text x="34" y="25" text-anchor="middle" font-family="system-ui,sans-serif" font-size="9" font-weight="800" fill="#fff">PACK</text>
</svg>
`;
}

function main() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const l0ByCat = new Map();
  for (const c of catalog.categories) {
    l0ByCat.set(c.id, c.l0 || c.id);
  }

  let n = 0;
  for (const p of catalog.products) {
    const l0 = l0ByCat.get(p.categoryId) || "general";
    const svg = generateSvg(p, l0);
    const file = `${p.id}.svg`;
    fs.writeFileSync(path.join(OUT_DIR, file), svg);
    p.image = `/catalog/products/${file}`;
    // keep packColor in sync with generated accent-ish tint
    const hue = hash(p.id) % 360;
    p.packColor = hsl(hue, 35, 94);
    n++;
    if (n % 100 === 0) console.log(`… ${n}/${catalog.products.length}`);
  }

  catalog.meta = {
    ...catalog.meta,
    packshots_at: new Date().toISOString(),
    note: "Per-SKU packshots in /public/catalog/products. L1 taxonomy internal.",
  };

  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n");
  console.log(`Wrote ${n} unique packshots → ${OUT_DIR}`);
  console.log(`Updated ${CATALOG}`);
}

main();
