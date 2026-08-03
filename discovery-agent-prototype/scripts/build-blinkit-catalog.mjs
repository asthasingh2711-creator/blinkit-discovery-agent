/**
 * Builds Blinkit-faithful L0→L1 taxonomy (L1 not shown in UI),
 * 2–3 SKUs per L1, and downloads local images into public/catalog/.
 *
 * Run: node scripts/build-blinkit-catalog.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";
import http from "node:http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_JSON = path.join(ROOT, "data", "blinkit-catalog.json");
const IMG_DIR = path.join(ROOT, "public", "catalog");

function slug(s) {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

/** L0 → { emoji, tint, unsplash queries, L1 names[] } */
const TAXONOMY = [
  {
    id: "bath-body",
    name: "Bath & Body",
    emoji: "🧴",
    tint: "#FFF0F3",
    q: "soap,skincare,bath",
    l1: [
      "Bathing Soaps",
      "Shower Gels & Scrubs",
      "Oral Care",
      "Handwash",
      "Fragrance & Talc",
      "Bath Accessories",
      "Shampoo",
      "Conditioner",
      "Face Cleaning",
      "Body Lotions & Oils",
      "Body Treatment & Roll On",
      "Bath & Beauty Gifts",
    ],
  },
  {
    id: "hair-care",
    name: "Hair",
    emoji: "💇",
    tint: "#FFF0F3",
    q: "hair,shampoo,cosmetics",
    l1: [
      "Shampoo",
      "Conditioner",
      "Hair Colour",
      "Hair Oil & Cream",
      "Hair Serums",
      "Hair Styling",
      "Appliances",
      "Hair Accessories",
    ],
  },
  {
    id: "skin-face",
    name: "Skin & Face",
    emoji: "✨",
    tint: "#FFF0F3",
    q: "skincare,face,cream",
    l1: [
      "Sunscreen",
      "Face Cleaning",
      "Face Oil, Serum & Essence",
      "Face Moisturisers",
      "Body Lotions & Oils",
      "Lip & Eye Care",
      "Face Masks & Packs",
      "Toners & Mists",
      "Acne & Blackhead Fixers",
      "Men's Grooming",
      "Women's Grooming",
    ],
  },
  {
    id: "beauty-cosmetics",
    name: "Beauty & Cosmetics",
    emoji: "💄",
    tint: "#FFF0F3",
    q: "makeup,lipstick,cosmetics",
    l1: [
      "Lipstick & Gloss",
      "Cleansers & Toners",
      "Foundation & Compact",
      "Blush & Highlighter",
      "Primer & Concealer",
      "Kajal & Eyeliners",
      "Bindi, Bangles & Others",
      "Nail Paints & Accessories",
      "Beauty Accessories",
      "Bath & Beauty Gifts",
      "Beauty E-Card",
    ],
  },
  {
    id: "feminine-hygiene",
    name: "Feminine Hygiene",
    emoji: "🌸",
    tint: "#FFF0F3",
    q: "wellness,pink,care",
    l1: [
      "Sanitary Pads",
      "Tampons & Menstrual Cups",
      "Period Panty",
      "Period Pain Relief",
      "Intimate Wash & Wipes",
      "Hair Removal",
      "Mom Care",
    ],
  },
  {
    id: "baby-care",
    name: "Baby Care",
    emoji: "🍼",
    tint: "#EEF5FF",
    q: "baby,diaper,infant",
    l1: [
      "Diaper & Wipes",
      "Baby Food",
      "Baby Shampoo & Soaps",
      "Skin & Hair Care",
      "Feeding Essentials",
      "Clothes & Accessories",
      "Health & Hygiene",
      "Baby Oral Care",
      "Baby Toys & Gifts",
      "Baby Gear",
      "Mom Care Needs",
    ],
  },
  {
    id: "health-pharma",
    name: "Health & Pharma",
    emoji: "💊",
    tint: "#E8F1FF",
    q: "medicine,pharmacy,health",
    l1: [
      "Fever & Pain Relief",
      "Cough, Cold & Flu",
      "Masks & Sanitizers",
      "Stomach & Digestive Care",
      "Protein Supplements",
      "Vitamins & Supplements",
      "Derma Medicines",
      "Bandaid & Wound Care",
      "Eye & Ear Care",
      "Adult Diapers",
      "Health & Ortho Supports",
      "Gynaecology Medicines",
      "Oral Care",
      "Diabetes Medicines",
      "Heart Medicines",
      "Neuro Medicines",
      "Hangover Cure",
      "Health & Wellness E-Cards",
    ],
  },
  {
    id: "sexual-wellness",
    name: "Sexual Wellness",
    emoji: "🔒",
    tint: "#F3E8FF",
    q: "wellness,health,care",
    l1: [
      "Massagers",
      "Condoms",
      "Lubricants",
      "Enhancers",
      "Adult Games",
      "Test Kits",
      "Medicines",
    ],
  },
  {
    id: "vegetables-fruits",
    name: "Vegetables & Fruits",
    emoji: "🥦",
    tint: "#E8F8EE",
    q: "fruits,vegetables,fresh",
    l1: [
      "Fresh Vegetables",
      "Fresh Fruits",
      "Exotics",
      "Coriander & Others",
      "Freshly Cut & Sprouts",
      "Trusted Organics",
      "Flowers & Leaves",
      "Seasonal",
      "Frozen Veg",
      "Hydroponic",
    ],
  },
  {
    id: "atta-rice-dal",
    name: "Atta, Rice & Dal",
    emoji: "🌾",
    tint: "#F5F0E6",
    q: "rice,flour,grains",
    l1: [
      "Atta",
      "Rice",
      "Dal",
      "Besan, Sooji & Maida",
      "Rajma, Chhole & Others",
      "Millet & Other Flours",
      "Organic",
      "Poha, Daliya & Other Grains",
      "Summer Specials",
    ],
  },
  {
    id: "oil-ghee-masala",
    name: "Oil, Ghee & Masala",
    emoji: "🫙",
    tint: "#FFF5E9",
    q: "spices,oil,cooking",
    l1: [
      "Oil",
      "Desi Ghee",
      "Cow Ghee",
      "Powdered Spices",
      "Non Veg Spices",
      "Salt, Sugar & Jaggery",
      "Whole Spices",
      "Gravy Mixes & Pastes",
      "Herbs & Seasoning",
      "Organic",
    ],
  },
  {
    id: "dairy-bread-eggs",
    name: "Dairy, Bread & Eggs",
    emoji: "🥛",
    tint: "#EEF5FF",
    q: "milk,bread,dairy",
    l1: [
      "Milk",
      "Bread & Pav",
      "Eggs",
      "Curd & Yogurt",
      "Cheese & Butter",
      "Batter",
      "Paneer & Tofu",
      "Soy Milk & More",
      "Lassi & Milkshakes",
      "Cream & Whitener",
    ],
  },
  {
    id: "bakery-biscuits",
    name: "Bakery & Biscuits",
    emoji: "🍪",
    tint: "#FFF5E9",
    q: "cookies,biscuits,bakery",
    l1: [
      "Cookies",
      "Cream Biscuits",
      "Healthy & Digestive",
      "Sweet & Salty",
      "Glucose & Marie",
      "Rusks & Wafers",
      "Cakes & Rolls",
      "Baking Ingredients",
      "Gourmet Bakery",
      "Biscuit Gift Pack",
    ],
  },
  {
    id: "dry-fruits-cereals",
    name: "Dry Fruits & Cereals",
    emoji: "🌾",
    tint: "#FFF5E9",
    q: "nuts,cereal,oats",
    l1: [
      "Dry Fruits",
      "Dry Fruits Snacks",
      "Corn Flakes & Kids Cereals",
      "Muesli & Granola",
      "Oats & Daliya",
      "Dates",
      "Seeds",
      "Vermicelli & Poha",
      "Organic & Premium",
      "Dry Fruit Gift Packs",
    ],
  },
  {
    id: "chicken-meat-fish",
    name: "Chicken, Meat & Fish",
    emoji: "🍗",
    tint: "#FFE8E8",
    q: "chicken,meat,seafood",
    l1: [
      "Chicken",
      "Fresh Meat",
      "Fish & Seafood",
      "Mutton",
      "Frozen Non-Veg Snacks",
      "Non Veg Spices",
      "Sausage, Salami & Ham",
      "Exotic Meat",
      "Fresh Marinades",
      "Plant Based Meat",
      "Eggs",
    ],
  },
  {
    id: "kitchenware-appliances",
    name: "Kitchenware & Appliances",
    emoji: "🍽️",
    tint: "#EEF5FF",
    q: "kitchen,cookware,utensils",
    l1: [
      "Bottles & Flasks",
      "Kitchen Accessories",
      "Mugs & Glasses",
      "Cookware & Sets",
      "Storage & Containers",
      "Barware",
      "Lunch Boxes",
      "Cutting & Chopping",
      "Dining & Serveware",
      "Kitchen Appliances",
      "Tissues & Disposables",
    ],
  },
  {
    id: "chips-namkeen",
    name: "Chips & Namkeen",
    emoji: "🍿",
    tint: "#FFF9E5",
    q: "chips,snacks,potato",
    l1: [
      "Chips & Wafers",
      "Bhujia & Mixtures",
      "Namkeen Snacks",
      "Nachos",
      "Healthy Snacks",
      "Popcorn",
      "Papad & Fryums",
      "Premium",
      "Gift Packs",
    ],
  },
  {
    id: "sweets-chocolates",
    name: "Sweets & Chocolates",
    emoji: "🍫",
    tint: "#F3E8FF",
    q: "chocolate,candy,sweets",
    l1: [
      "Chocolates",
      "Chocolate Packs",
      "Chocolate Gift Pack",
      "Indian Sweets",
      "Candies & Gum",
      "Premium",
      "Energy Bars",
      "Syrups",
    ],
  },
  {
    id: "drinks-juices",
    name: "Drinks & Juices",
    emoji: "🥤",
    tint: "#FFE8E8",
    q: "juice,soda,beverage",
    l1: [
      "Soft Drinks",
      "Fruit Juices",
      "Zero Sugar Drinks",
      "Energy Drinks",
      "Hydration Drinks",
      "Soda & Mixers",
      "Water & Ice Cubes",
      "Mango Drinks",
      "Soy Milk & More",
      "Cold Coffee & Ice Tea",
      "Coconut Water",
      "Concentrates & Syrups",
      "Premium",
      "Beverages Gift Packs",
    ],
  },
  {
    id: "tea-coffee",
    name: "Tea, Coffee & Milk Drinks",
    emoji: "☕",
    tint: "#F5F0E6",
    q: "tea,coffee,beverage",
    l1: [
      "Tea",
      "Coffee",
      "Hot Chocolate",
      "Green Tea",
      "Milk Drinks",
      "Cold Coffee & Ice Tea",
      "Bags & Premixes",
      "Premium",
      "Herbal Infusion",
    ],
  },
  {
    id: "instant-food",
    name: "Instant Food",
    emoji: "🍜",
    tint: "#FFF5E9",
    q: "noodles,pasta,instant",
    l1: [
      "Noodles",
      "Frozen Veg Snacks",
      "Pasta",
      "Frozen Non-Veg Snacks",
      "Soup",
      "Ready to Eat",
      "Idli & Dosa Batter",
      "Dessert & Cake Mixes",
      "Organic & Premium",
      "Energy Bars",
    ],
  },
  {
    id: "sauces-spreads",
    name: "Sauces & Spreads",
    emoji: "🫙",
    tint: "#FFF5E9",
    q: "sauce,ketchup,jam",
    l1: [
      "Tomato Ketchup",
      "Jam & Spreads",
      "Mayonnaise",
      "Chutney & Pickle",
      "Peanut Butter",
      "Asian Sauces",
      "Chyawanprash & Honey",
      "Syrups",
      "Dips & Salad Dressings",
      "Cooking Sauces",
      "Premium",
    ],
  },
  {
    id: "paan-corner",
    name: "Paan Corner",
    emoji: "🍃",
    tint: "#EEF5FF",
    q: "mint,leaf,green",
    l1: [
      "Cigarettes",
      "Lighters",
      "Cigar",
      "Rolling Needs",
      "Hookah Needs",
      "Rolling Tobacco",
      "Paan Masala",
      "Ashtrays",
      "Mouth Fresheners & Gums",
      "Non-Tobacco Blends",
      "Smoking Cessation",
    ],
  },
  {
    id: "ice-creams",
    name: "Ice Creams & More",
    emoji: "🍦",
    tint: "#EEF5FF",
    q: "icecream,dessert,frozen",
    l1: [
      "Tubs",
      "Sticks",
      "Cones",
      "Cassata & Sandwich",
      "Single Serve Cups",
      "Cakes & Others",
      "Guilt-Free",
      "Gourmet",
      "Syrups",
    ],
  },
  {
    id: "home-lifestyle",
    name: "Home & Lifestyle",
    emoji: "🏠",
    tint: "#EEF5FF",
    q: "home,decor,lifestyle",
    l1: [
      "Home Decor",
      "Plants & Bouquets",
      "Bedsheets & Towels",
      "Gardening",
      "Decorative Lights",
      "Home Needs",
      "Tissues & Disposables",
      "Jewellery",
      "Innerwear",
      "Lifestyle Accessories",
      "Party & Festive Needs",
      "Socks & Handkerchiefs",
      "Fresheners",
      "Pooja Needs",
      "Bathroom Essentials",
      "Bags",
      "E-Gift Cards",
    ],
  },
  {
    id: "cleaners-repellents",
    name: "Cleaners & Repellents",
    emoji: "🧹",
    tint: "#EEF5FF",
    q: "cleaning,detergent,laundry",
    l1: [
      "Repellents & Disinfectants",
      "Detergent Powder & Bars",
      "Liquid Detergents",
      "Laundry Additives",
      "Dishwashing Gels & Bars",
      "Dishwashing Accessories",
      "Toilet Cleaners",
      "Floor Cleaners",
      "Cleaning Tools",
      "Garbage Bags",
      "Glass, Metal Cleaners & Others",
      "Shoe Care",
      "Machine & Car Care",
      "Household Appliance Cleaners",
    ],
  },
  {
    id: "electronics",
    name: "Electronics",
    emoji: "🔌",
    tint: "#EEF5FF",
    q: "electronics,gadgets,tech",
    l1: [
      "Trimmers & Hair Appliances",
      "Earphones & Headsets",
      "Speakers",
      "Mobile & Computer",
      "Decorative Lights",
      "Chargers & Cables",
      "Smart Watches",
      "Kitchen Appliances",
      "Laptop & Mobile Phones",
      "Batteries",
      "Extension Cables & Accessories",
      "Home Appliances",
      "Music Instruments & Accessories",
      "Electronics E-Card",
    ],
  },
  {
    id: "stationery-games",
    name: "Stationery & Games",
    emoji: "📚",
    tint: "#FFF5E9",
    q: "stationery,books,toys",
    l1: [
      "Notebooks & Diaries",
      "Pens & Pencils",
      "Toys & Games",
      "Glue & Tape",
      "Books & Magazines",
      "Bags & School Needs",
      "Children's Books",
      "Arts & Crafts",
      "Files & Office Needs",
      "Gift Wraps & Bags",
      "Sports & Gym",
      "Shoe Polish & Brush",
    ],
  },
  {
    id: "pet-care",
    name: "Pet Care",
    emoji: "🐶",
    tint: "#FFF4CC",
    q: "dog,pet,puppy",
    l1: ["Dog Food", "Cat Food", "Treats", "Grooming", "Accessories"],
  },
  {
    id: "stores",
    name: "Stores",
    emoji: "🏪",
    tint: "#EEF5FF",
    q: "gift,print,shop",
    l1: ["Print Store", "Rakhi Gifts"],
  },
  {
    id: "e-cards",
    name: "E-Cards",
    emoji: "🎁",
    tint: "#F3E8FF",
    q: "gift,card,present",
    l1: ["E-Gift Cards"],
  },
];

const BRANDS = [
  "Amul",
  "Britannia",
  "Nestlé",
  "Parle",
  "Haldiram's",
  "Tata",
  "Fortune",
  "Dabur",
  "Himalaya",
  "Dove",
  "Colgate",
  "Pampers",
  "Maggi",
  "Cadbury",
  "Coca-Cola",
  "Pepsi",
  "Mother Dairy",
  "Epigamia",
  "Saffola",
  "Kellogg's",
  "Real",
  "Tropicana",
  "Surf Excel",
  "Dettol",
  "Nivea",
  "Lays",
  "Kurkure",
  "MDH",
  "Everest",
  "Patanjali",
  "Bikaji",
  "Paper Boat",
  "Kinley",
  "Bisleri",
  "Pedigree",
  "Whiskas",
  "Huggies",
  "Johnson's",
  "Crocin",
  "Vicks",
  "Oregano",
  "Urban Platter",
  "FreshCo",
  "Daily Essentials",
  "BlinkSelect",
];

const UNITS = ["1 pc", "100 g", "200 g", "500 g", "1 kg", "250 ml", "500 ml", "1 L", "6 pcs", "12 pcs", "pack of 2"];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function productName(l1Name, i) {
  const variants = ["Classic", "Fresh", "Daily", "Premium", "Family Pack"];
  const base = l1Name.split(/[,&]/)[0].trim();
  return `${variants[i % variants.length]} ${base}`;
}

function fetchBuffer(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          "User-Agent": "BlinkitDiscoveryCatalogBuilder/1.0",
          Accept: "image/*,*/*",
        },
      },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirects < 5
        ) {
          const next = new URL(res.headers.location, url).href;
          res.resume();
          fetchBuffer(next, redirects + 1).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
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
    req.setTimeout(20000, () => {
      req.destroy(new Error("timeout"));
    });
  });
}

async function downloadL0Images() {
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const map = {};
  for (const l0 of TAXONOMY) {
    map[l0.id] = [];
    for (let i = 0; i < 3; i++) {
      const file = `${l0.id}-${i}.jpg`;
      const dest = path.join(IMG_DIR, file);
      if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
        map[l0.id].push(`/catalog/${file}`);
        continue;
      }
      // Deterministic stock photos via Lorem Flickr (category tags) → saved locally
      const tags = l0.q.split(",")[i % l0.q.split(",").length];
      const url = `https://loremflickr.com/320/320/${encodeURIComponent(tags)}?lock=${hash(l0.id) + i}`;
      try {
        process.stdout.write(`img ${file}… `);
        const buf = await fetchBuffer(url);
        if (buf.length < 500) throw new Error("tiny");
        fs.writeFileSync(dest, buf);
        map[l0.id].push(`/catalog/${file}`);
        console.log("ok", buf.length);
      } catch (e) {
        console.log("fail", e.message);
        // SVG fallback always available
        const svgFile = `${l0.id}-${i}.svg`;
        const svgDest = path.join(IMG_DIR, svgFile);
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${l0.tint}"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="320" height="320" fill="url(#g)"/>
  <rect x="40" y="50" width="240" height="220" rx="24" fill="#fff" stroke="#e5e5e5"/>
  <text x="160" y="150" text-anchor="middle" font-size="64">${l0.emoji}</text>
  <text x="160" y="210" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#333">${l0.name}</text>
</svg>`;
        fs.writeFileSync(svgDest, svg);
        map[l0.id].push(`/catalog/${svgFile}`);
      }
    }
  }
  return map;
}

/** Stable SKUs used by discovery / demo carts — must keep IDs */
const CRITICAL = [
  {
    id: "amul-taaza-1l",
    name: "Amul Taaza Toned Milk",
    brand: "Amul",
    categoryId: "dairy-bread-eggs-milk",
    unit: "1 L",
    price: 58,
    mrp: 60,
    emoji: "🥛",
    tags: ["breakfast"],
  },
  {
    id: "britannia-bread",
    name: "Britannia Whole Wheat Bread",
    brand: "Britannia",
    categoryId: "dairy-bread-eggs-bread-and-pav",
    unit: "400 g",
    price: 50,
    mrp: 55,
    emoji: "🍞",
    tags: ["breakfast"],
  },
  {
    id: "farm-eggs-6",
    name: "Farm Fresh Eggs",
    brand: "Farm Fresh",
    categoryId: "dairy-bread-eggs-eggs",
    unit: "6 pcs",
    price: 48,
    mrp: 55,
    emoji: "🥚",
    tags: ["breakfast"],
  },
  {
    id: "epigamia-greek-yogurt",
    name: "Epigamia Greek Yogurt Natural",
    brand: "Epigamia",
    categoryId: "dairy-bread-eggs-curd-and-yogurt",
    unit: "85 g",
    price: 50,
    mrp: 55,
    emoji: "🥣",
    tags: ["breakfast", "discovery"],
  },
  {
    id: "fresh-fruit-cup",
    name: "Fresh Fruit Cup",
    brand: "FreshCo",
    categoryId: "vegetables-fruits-freshly-cut-and-sprouts",
    unit: "150 g",
    price: 60,
    mrp: 75,
    emoji: "🍎",
    tags: ["discovery"],
  },
  {
    id: "banana",
    name: "Banana Robusta",
    brand: "FreshCo",
    categoryId: "vegetables-fruits-fresh-fruits",
    unit: "6 pcs",
    price: 40,
    mrp: 48,
    emoji: "🍌",
    tags: ["discovery"],
  },
  {
    id: "apple-shimla",
    name: "Apple Shimla",
    brand: "FreshCo",
    categoryId: "vegetables-fruits-fresh-fruits",
    unit: "4 pcs",
    price: 120,
    mrp: 140,
    emoji: "🍎",
    tags: ["discovery"],
  },
  {
    id: "saffola-oats",
    name: "Saffola Oats",
    brand: "Saffola",
    categoryId: "dry-fruits-cereals-oats-and-daliya",
    unit: "1 kg",
    price: 185,
    mrp: 210,
    emoji: "🥣",
    tags: ["discovery"],
  },
  {
    id: "kelloggs-cornflakes",
    name: "Kellogg's Corn Flakes",
    brand: "Kellogg's",
    categoryId: "dry-fruits-cereals-corn-flakes-and-kids-cereals",
    unit: "475 g",
    price: 199,
    mrp: 220,
    emoji: "🥣",
    tags: ["discovery"],
  },
  {
    id: "peanut-butter",
    name: "Pintola Peanut Butter",
    brand: "Pintola",
    categoryId: "sauces-spreads-peanut-butter",
    unit: "350 g",
    price: 149,
    mrp: 179,
    emoji: "🥜",
    tags: ["discovery"],
  },
  {
    id: "amul-butter",
    name: "Amul Butter",
    brand: "Amul",
    categoryId: "dairy-bread-eggs-cheese-and-butter",
    unit: "100 g",
    price: 58,
    mrp: 60,
    emoji: "🧈",
  },
  {
    id: "chia-seeds",
    name: "Organic Chia Seeds",
    brand: "Urban Platter",
    categoryId: "dry-fruits-cereals-seeds",
    unit: "200 g",
    price: 199,
    mrp: 249,
    emoji: "🌱",
    tags: ["discovery"],
  },
  {
    id: "california-almonds",
    name: "California Almonds",
    brand: "Happilo",
    categoryId: "dry-fruits-cereals-dry-fruits",
    unit: "200 g",
    price: 249,
    mrp: 299,
    emoji: "🌰",
    tags: ["discovery"],
  },
  {
    id: "coconut-water",
    name: "Raw Pressery Coconut Water",
    brand: "Raw Pressery",
    categoryId: "drinks-juices-coconut-water",
    unit: "200 ml",
    price: 50,
    mrp: 60,
    emoji: "🥥",
    tags: ["discovery"],
  },
  {
    id: "ors-electral",
    name: "Electral ORS",
    brand: "Electral",
    categoryId: "health-pharma-stomach-and-digestive-care",
    unit: "21.8 g",
    price: 25,
    mrp: 30,
    emoji: "💊",
    tags: ["discovery"],
  },
  {
    id: "kinley-water",
    name: "Kinley Packaged Water",
    brand: "Kinley",
    categoryId: "drinks-juices-water-and-ice-cubes",
    unit: "1 L",
    price: 20,
    mrp: 20,
    emoji: "💧",
  },
  {
    id: "crocin",
    name: "Crocin Advance",
    brand: "Crocin",
    categoryId: "health-pharma-fever-and-pain-relief",
    unit: "15 tabs",
    price: 30,
    mrp: 35,
    emoji: "💊",
  },
  {
    id: "vicks-vaporub",
    name: "Vicks VapoRub",
    brand: "Vicks",
    categoryId: "health-pharma-cough-cold-and-flu",
    unit: "25 g",
    price: 45,
    mrp: 50,
    emoji: "🧴",
  },
  {
    id: "digital-thermometer",
    name: "Digital Thermometer",
    brand: "Dr. Trust",
    categoryId: "health-pharma-health-and-ortho-supports",
    unit: "1 pc",
    price: 199,
    mrp: 299,
    emoji: "🌡️",
    tags: ["discovery"],
  },
  {
    id: "lays-classic",
    name: "Lay's Classic Salted",
    brand: "Lay's",
    categoryId: "chips-namkeen-chips-and-wafers",
    unit: "52 g",
    price: 20,
    mrp: 20,
    emoji: "🥔",
  },
  {
    id: "lays-magic",
    name: "Lay's India's Magic Masala",
    brand: "Lay's",
    categoryId: "chips-namkeen-chips-and-wafers",
    unit: "48 g",
    price: 20,
    mrp: 20,
    emoji: "🥔",
  },
  {
    id: "kurkure",
    name: "Kurkure Masala Munch",
    brand: "Kurkure",
    categoryId: "chips-namkeen-namkeen-snacks",
    unit: "90 g",
    price: 20,
    mrp: 20,
    emoji: "🍿",
  },
  {
    id: "oreo",
    name: "Cadbury Oreo Original",
    brand: "Cadbury",
    categoryId: "bakery-biscuits-cream-biscuits",
    unit: "120 g",
    price: 30,
    mrp: 35,
    emoji: "🍪",
  },
  {
    id: "parle-g",
    name: "Parle-G Gold Biscuits",
    brand: "Parle",
    categoryId: "bakery-biscuits-glucose-and-marie",
    unit: "250 g",
    price: 30,
    mrp: 35,
    emoji: "🍪",
  },
  {
    id: "cadbury-dairy-milk",
    name: "Cadbury Dairy Milk",
    brand: "Cadbury",
    categoryId: "sweets-chocolates-chocolates",
    unit: "55 g",
    price: 45,
    mrp: 50,
    emoji: "🍫",
  },
  {
    id: "kitkat",
    name: "Nestlé KitKat",
    brand: "Nestlé",
    categoryId: "sweets-chocolates-chocolates",
    unit: "37.3 g",
    price: 30,
    mrp: 35,
    emoji: "🍫",
  },
  {
    id: "coca-cola",
    name: "Coca-Cola",
    brand: "Coca-Cola",
    categoryId: "drinks-juices-soft-drinks",
    unit: "750 ml",
    price: 40,
    mrp: 45,
    emoji: "🥤",
  },
  {
    id: "sprite",
    name: "Sprite",
    brand: "Sprite",
    categoryId: "drinks-juices-soft-drinks",
    unit: "750 ml",
    price: 40,
    mrp: 45,
    emoji: "🥤",
  },
  {
    id: "maaza",
    name: "Maaza Mango",
    brand: "Maaza",
    categoryId: "drinks-juices-mango-drinks",
    unit: "1.2 L",
    price: 70,
    mrp: 80,
    emoji: "🥭",
  },
  {
    id: "real-juice",
    name: "Real Fruit Power Mixed Fruit",
    brand: "Real",
    categoryId: "drinks-juices-fruit-juices",
    unit: "1 L",
    price: 110,
    mrp: 125,
    emoji: "🧃",
  },
  {
    id: "paper-plates",
    name: "Paper Plates",
    brand: "BlinkSelect",
    categoryId: "kitchenware-appliances-tissues-and-disposables",
    unit: "10 pcs",
    price: 45,
    mrp: 55,
    emoji: "🍽️",
    tags: ["discovery"],
  },
  {
    id: "paper-cups",
    name: "Paper Cups",
    brand: "BlinkSelect",
    categoryId: "kitchenware-appliances-tissues-and-disposables",
    unit: "50 pcs",
    price: 60,
    mrp: 75,
    emoji: "🥤",
    tags: ["discovery"],
  },
  {
    id: "center-fresh",
    name: "Center Fresh Chewing Gum",
    brand: "Center Fresh",
    categoryId: "paan-corner-mouth-fresheners-and-gums",
    unit: "1 pack",
    price: 10,
    mrp: 10,
    emoji: "🍬",
  },
  {
    id: "maggi",
    name: "Maggi 2-Minute Noodles",
    brand: "Maggi",
    categoryId: "instant-food-noodles",
    unit: "70 g",
    price: 14,
    mrp: 14,
    emoji: "🍜",
  },
  {
    id: "yippee",
    name: "Sunfeast Yippee Noodles",
    brand: "Sunfeast",
    categoryId: "instant-food-noodles",
    unit: "70 g",
    price: 14,
    mrp: 14,
    emoji: "🍜",
  },
  {
    id: "onion",
    name: "Onion",
    brand: "FreshCo",
    categoryId: "vegetables-fruits-fresh-vegetables",
    unit: "1 kg",
    price: 40,
    mrp: 50,
    emoji: "🧅",
  },
  {
    id: "tomato",
    name: "Tomato",
    brand: "FreshCo",
    categoryId: "vegetables-fruits-fresh-vegetables",
    unit: "500 g",
    price: 30,
    mrp: 40,
    emoji: "🍅",
  },
  {
    id: "tata-salt",
    name: "Tata Salt",
    brand: "Tata",
    categoryId: "oil-ghee-masala-salt-sugar-and-jaggery",
    unit: "1 kg",
    price: 28,
    mrp: 30,
    emoji: "🧂",
  },
  {
    id: "fortune-oil",
    name: "Fortune Sunflower Oil",
    brand: "Fortune",
    categoryId: "oil-ghee-masala-oil",
    unit: "1 L",
    price: 145,
    mrp: 160,
    emoji: "🫙",
  },
  {
    id: "toor-dal",
    name: "Toor Dal",
    brand: "Tata Sampann",
    categoryId: "atta-rice-dal-dal",
    unit: "1 kg",
    price: 160,
    mrp: 180,
    emoji: "🫘",
  },
  {
    id: "india-gate-basmati",
    name: "India Gate Basmati Rice",
    brand: "India Gate",
    categoryId: "atta-rice-dal-rice",
    unit: "1 kg",
    price: 145,
    mrp: 165,
    emoji: "🍚",
  },
  {
    id: "mdh-garam",
    name: "MDH Garam Masala",
    brand: "MDH",
    categoryId: "oil-ghee-masala-powdered-spices",
    unit: "100 g",
    price: 72,
    mrp: 80,
    emoji: "🫙",
  },
  {
    id: "surf-excel",
    name: "Surf Excel Matic",
    brand: "Surf Excel",
    categoryId: "cleaners-repellents-detergent-powder-and-bars",
    unit: "1 kg",
    price: 225,
    mrp: 250,
    emoji: "🧺",
  },
  {
    id: "dettol-soap",
    name: "Dettol Original Soap",
    brand: "Dettol",
    categoryId: "bath-body-bathing-soaps",
    unit: "75 g",
    price: 35,
    mrp: 40,
    emoji: "🧼",
  },
  {
    id: "colgate-strong",
    name: "Colgate Strong Teeth",
    brand: "Colgate",
    categoryId: "bath-body-oral-care",
    unit: "200 g",
    price: 110,
    mrp: 125,
    emoji: "🦷",
  },
  {
    id: "himalaya-facewash",
    name: "Himalaya Neem Face Wash",
    brand: "Himalaya",
    categoryId: "skin-face-face-cleaning",
    unit: "150 ml",
    price: 140,
    mrp: 160,
    emoji: "🧴",
  },
  {
    id: "pampers",
    name: "Pampers Baby Dry",
    brand: "Pampers",
    categoryId: "baby-care-diaper-and-wipes",
    unit: "jumbo",
    price: 499,
    mrp: 599,
    emoji: "🍼",
  },
  {
    id: "huggies",
    name: "Huggies Wonder Pants",
    brand: "Huggies",
    categoryId: "baby-care-diaper-and-wipes",
    unit: "jumbo",
    price: 479,
    mrp: 549,
    emoji: "🍼",
  },
  {
    id: "cerelac",
    name: "Nestlé Cerelac",
    brand: "Nestlé",
    categoryId: "baby-care-baby-food",
    unit: "300 g",
    price: 249,
    mrp: 279,
    emoji: "🥣",
  },
  {
    id: "johnson-baby",
    name: "Johnson's Baby Soap",
    brand: "Johnson's",
    categoryId: "baby-care-baby-shampoo-and-soaps",
    unit: "75 g",
    price: 55,
    mrp: 65,
    emoji: "🍼",
  },
  {
    id: "nestle-aplus",
    name: "Nestlé a+",
    brand: "Nestlé",
    categoryId: "dairy-bread-eggs-milk",
    unit: "1 L",
    price: 74,
    mrp: 78,
    emoji: "🥛",
  },
  {
    id: "pedigree",
    name: "Pedigree Adult",
    brand: "Pedigree",
    categoryId: "pet-care-dog-food",
    unit: "1.2 kg",
    price: 350,
    mrp: 399,
    emoji: "🐶",
  },
  {
    id: "whiskas",
    name: "Whiskas Cat Food",
    brand: "Whiskas",
    categoryId: "pet-care-cat-food",
    unit: "480 g",
    price: 180,
    mrp: 210,
    emoji: "🐱",
  },
  {
    id: "me-o",
    name: "Me-O Cat Food",
    brand: "Me-O",
    categoryId: "pet-care-cat-food",
    unit: "1.2 kg",
    price: 320,
    mrp: 360,
    emoji: "🐱",
  },
  {
    id: "dog-treats",
    name: "Dog Treats Biscuits",
    brand: "Pedigree",
    categoryId: "pet-care-treats",
    unit: "200 g",
    price: 99,
    mrp: 120,
    emoji: "🦴",
  },
  {
    id: "tick-shampoo",
    name: "Anti-Tick Pet Shampoo",
    brand: "Himalaya",
    categoryId: "pet-care-grooming",
    unit: "200 ml",
    price: 199,
    mrp: 249,
    emoji: "🧴",
  },
  {
    id: "puppy-pads",
    name: "Puppy Training Pads",
    brand: "BlinkSelect",
    categoryId: "pet-care-accessories",
    unit: "10 pcs",
    price: 249,
    mrp: 299,
    emoji: "📦",
  },
  {
    id: "tata-gold",
    name: "Tata Tea Gold",
    brand: "Tata",
    categoryId: "tea-coffee-tea",
    unit: "500 g",
    price: 280,
    mrp: 310,
    emoji: "☕",
  },
  {
    id: "mother-dairy-curd",
    name: "Mother Dairy Curd",
    brand: "Mother Dairy",
    categoryId: "dairy-bread-eggs-curd-and-yogurt",
    unit: "400 g",
    price: 35,
    mrp: 38,
    emoji: "🥣",
  },
];

async function main() {
  console.log("Downloading L0 images…");
  const imgMap = await downloadL0Images();

  const categories = [];
  const products = [];
  const usedIds = new Set();

  for (const l0 of TAXONOMY) {
    categories.push({
      id: l0.id,
      name: l0.name,
      emoji: l0.emoji,
      imageTint: l0.tint,
      l0: l0.id,
    });

    for (const l1Name of l0.l1) {
      const l1Id = `${l0.id}-${slug(l1Name)}`;
      categories.push({
        id: l1Id,
        name: l1Name,
        emoji: l0.emoji,
        imageTint: l0.tint,
        l0: l0.id,
        parent: l0.id,
      });

      for (let i = 0; i < 3; i++) {
        const id = `${l1Id}-${i + 1}`;
        if (usedIds.has(id)) continue;
        usedIds.add(id);
        const brand = BRANDS[(hash(id) + i) % BRANDS.length];
        const price = 20 + (hash(id) % 480);
        const mrp = price + 5 + (hash(id + "m") % 40);
        const imgs = imgMap[l0.id] || [];
        products.push({
          id,
          name: `${brand} ${productName(l1Name, i)}`,
          brand,
          categoryId: l1Id,
          unit: UNITS[hash(id) % UNITS.length],
          price,
          mrp,
          rating: 3.8 + ((hash(id) % 12) / 10),
          ratingCount: 200 + (hash(id) % 80000),
          inStock: true,
          returnWindow: "48-hr return",
          packColor: l0.tint,
          emoji: l0.emoji,
          image: imgs[i % imgs.length] || imgs[0],
        });
      }
    }
  }

  // Overlay critical products (stable IDs for discovery)
  for (const c of CRITICAL) {
    const imgs = imgMap[c.categoryId.split("-").slice(0, 2).join("-")] 
      || imgMap[Object.keys(imgMap).find((k) => c.categoryId.startsWith(k))] 
      || [];
    // resolve L0 from categoryId prefix
    let l0id = TAXONOMY.find((t) => c.categoryId.startsWith(t.id))?.id;
    const image = (l0id && imgMap[l0id]?.[0]) || imgs[0] || "/catalog/dairy-bread-eggs-0.svg";

    const idx = products.findIndex((p) => p.id === c.id);
    const full = {
      rating: 4.3,
      ratingCount: 12000,
      inStock: true,
      returnWindow: "48-hr return",
      packColor: TAXONOMY.find((t) => t.id === l0id)?.tint || "#FFF8E8",
      image,
      ...c,
      image,
    };
    if (idx >= 0) products[idx] = { ...products[idx], ...full };
    else products.unshift(full);
    usedIds.add(c.id);
  }

  const catalog = {
    meta: {
      source: "blinkit-faithful-generated",
      note: "L0 shown in UI; L1 taxonomy is internal. Images cached in /public/catalog.",
      store_id: "gurgaon-sec50-demo",
      lat: 28.4595,
      lon: 77.0266,
      scraped_at: new Date().toISOString(),
      currency: "INR",
      blinkit_taxonomy_at: new Date().toISOString(),
      product_count: products.length,
      category_count: categories.length,
    },
    categories,
    products,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2) + "\n");
  console.log(
    `Wrote ${categories.length} categories, ${products.length} products → ${OUT_JSON}`,
  );
  console.log(`Images in ${IMG_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
