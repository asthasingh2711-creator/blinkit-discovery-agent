/**
 * Rebuild product SKUs with category-correct brands & units.
 * Keeps L0/L1 category tree; preserves critical demo IDs.
 * Does NOT assign shared aisle photos (heroes get real photos separately).
 *
 * Run: node scripts/rebuild-catalog-products.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CATALOG = path.join(ROOT, "data", "blinkit-catalog.json");

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Brands allowed per L0 — never cross (no Pedigree on pads). */
const BRANDS_BY_L0 = {
  "bath-body": ["Dove", "Dettol", "Colgate", "Pears", "Lifebuoy", "Himalaya", "Nivea", "Palmolive"],
  "hair-care": ["Dove", "Pantene", "Sunsilk", "Indulekha", "Wow", "L'Oreal", "Clinic Plus"],
  "skin-face": ["Nivea", "Himalaya", "Neutrogena", "Minimalist", "Cetaphil", "Lotus", "Lakme"],
  "beauty-cosmetics": ["Lakme", "Maybelline", "Sugar", "Nykaa", "Colorbar", "Insight"],
  "feminine-hygiene": ["Whisper", "Stayfree", "Sofy", "Paree", "Sirona", "Nua", "Carmesi", "Carefree"],
  "baby-care": ["Pampers", "Huggies", "Johnson's", "Himalaya Baby", "MamyPoko", "Cerelac", "Nestlé"],
  "health-pharma": ["Crocin", "Vicks", "Dettol", "Electral", "Volini", "Moov", "Himalaya", "Dr. Morepen"],
  "sexual-wellness": ["Durex", "Manforce", "Skore", "Kamasutra", "Moods"],
  "vegetables-fruits": ["FreshCo", "Farmik", "Safal", "BlinkSelect"],
  "atta-rice-dal": ["Aashirvaad", "Fortune", "India Gate", "Tata Sampann", "Organic Tattva", "Patanjali"],
  "oil-ghee-masala": ["Fortune", "Saffola", "MDH", "Everest", "Amul", "Tata", "Engine"],
  "dairy-bread-eggs": ["Amul", "Mother Dairy", "Britannia", "Epigamia", "Nestlé", "English Oven", "Farm Fresh"],
  "bakery-biscuits": ["Britannia", "Parle", "Cadbury", "Sunfeast", "Oreo", "Unibic", "Hide & Seek"],
  "dry-fruits-cereals": ["Happilo", "Saffola", "Kellogg's", "Quaker", "Yoga Bar", "Urban Platter", "Nutraj"],
  "chicken-meat-fish": ["Licious", "FreshToHome", "Zappfresh", "Sumeru", "BlinkSelect"],
  "kitchenware-appliances": ["Scotch-Brite", "Cello", "Borosil", "Pigeon", "Prestige", "BlinkSelect"],
  "chips-namkeen": ["Lay's", "Kurkure", "Haldiram's", "Bikaji", "Bingo", "Uncle Chipps", "Too Yumm"],
  "sweets-chocolates": ["Cadbury", "Nestlé", "Amul", "Ferrero", "KitKat", "Perk", "Munch"],
  "drinks-juices": ["Coca-Cola", "Sprite", "Pepsi", "Maaza", "Real", "Tropicana", "Kinley", "Paper Boat", "Raw Pressery"],
  "tea-coffee": ["Tata", "Red Label", "Nescafe", "Bru", "Wagh Bakri", "Society", "Continental"],
  "instant-food": ["Maggi", "Yippee", "Knorr", "Ching's", "MTR", "Bambino", "Top Ramen"],
  "sauces-spreads": ["Kissan", "Maggi", "Funfoods", "Veeba", "Pintola", "Dabur", "Hellmann's"],
  "paan-corner": ["Center Fresh", "Pass Pass", "Rajnigandha", "Pan Bahar", "Happydent", "Mentos"],
  "ice-creams": ["Amul", "Kwality Wall's", "Havmor", "Baskin Robbins", "Mother Dairy", "Nic"],
  "home-lifestyle": ["BlinkSelect", "Spaces", "Bombay Dyeing", "Ikea", "Home Centre"],
  "cleaners-repellents": ["Surf Excel", "Harpic", "Lizol", "Vim", "Colin", "Hit", "Good Knight"],
  electronics: ["boAt", "Mi", "Portronics", "Syska", "Ambrane", "Noise"],
  "stationery-games": ["Classmate", "Navneet", "Camel", "Faber-Castell", "Funskool", "Lego"],
  "pet-care": ["Pedigree", "Whiskas", "Me-O", "Drools", "Royal Canin", "Sheba"],
  stores: ["BlinkSelect", "PrintStore"],
  "e-cards": ["Blinkit", "Amazon Pay", "Google Play"],
};

const UNITS_BY_L0 = {
  "bath-body": ["75 g", "100 g", "200 ml", "250 ml", "500 ml"],
  "hair-care": ["80 ml", "180 ml", "340 ml", "650 ml"],
  "skin-face": ["50 g", "100 ml", "150 ml", "200 ml"],
  "beauty-cosmetics": ["1 pc", "4 g", "9 g", "15 ml"],
  "feminine-hygiene": ["pack of 8", "pack of 16", "pack of 20", "pack of 30", "1 pc"],
  "baby-care": ["pack of 28", "pack of 54", "100 ml", "200 g", "300 g"],
  "health-pharma": ["15 tabs", "10 tabs", "25 g", "100 ml", "1 pc"],
  "sexual-wellness": ["pack of 3", "pack of 10", "50 ml", "1 pc"],
  "vegetables-fruits": ["500 g", "1 kg", "250 g", "6 pcs", "4 pcs", "1 pc"],
  "atta-rice-dal": ["500 g", "1 kg", "5 kg"],
  "oil-ghee-masala": ["100 g", "200 g", "500 ml", "1 L", "1 kg"],
  "dairy-bread-eggs": ["500 ml", "1 L", "400 g", "200 g", "6 pcs", "12 pcs", "100 g"],
  "bakery-biscuits": ["50 g", "100 g", "120 g", "200 g", "250 g"],
  "dry-fruits-cereals": ["100 g", "200 g", "400 g", "475 g", "1 kg"],
  "chicken-meat-fish": ["250 g", "500 g", "1 kg"],
  "kitchenware-appliances": ["1 pc", "pack of 10", "pack of 25", "pack of 50"],
  "chips-namkeen": ["28 g", "48 g", "52 g", "90 g", "150 g"],
  "sweets-chocolates": ["24 g", "37 g", "55 g", "100 g", "pack of 4"],
  "drinks-juices": ["250 ml", "600 ml", "750 ml", "1 L", "1.2 L", "2 L"],
  "tea-coffee": ["100 g", "200 g", "250 g", "500 g", "50 g"],
  "instant-food": ["70 g", "140 g", "280 g", "50 g", "1 pack"],
  "sauces-spreads": ["200 g", "350 g", "500 g", "1 kg"],
  "paan-corner": ["1 pack", "12 g", "20 g", "50 g"],
  "ice-creams": ["100 ml", "500 ml", "1 L", "4 sticks"],
  "home-lifestyle": ["1 pc", "pack of 2", "pack of 4"],
  "cleaners-repellents": ["500 ml", "1 L", "1 kg", "2 kg"],
  electronics: ["1 pc"],
  "stationery-games": ["1 pc", "pack of 10", "pack of 5"],
  "pet-care": ["200 g", "480 g", "1.2 kg", "200 ml", "10 pcs"],
  stores: ["1 pc"],
  "e-cards": ["₹500", "₹1000", "1 pc"],
};

const VARIANTS = ["", "Classic", "Fresh", "Daily", "Soft", "Active", "Ultra"];

function brandsFor(l0) {
  return BRANDS_BY_L0[l0] || ["BlinkSelect"];
}

function unitFor(l0, id) {
  const units = UNITS_BY_L0[l0] || ["1 pc"];
  return units[hash(id) % units.length];
}

function makeName(brand, l1Name, i) {
  const base = l1Name.split(/[,&]/)[0].trim();
  const v = VARIANTS[i % VARIANTS.length];
  // Avoid "Classic Sanitary Pads" sounding weird with Soft etc.
  if (/sanitary|tampon|pad|panty/i.test(base)) {
    const padVars = ["Ultra Soft", "Cottony Soft", "Overnight", "Regular"];
    return `${brand} ${padVars[i % padVars.length]} ${base}`;
  }
  if (/shampoo|conditioner|soap|oil|juice|chips/i.test(base)) {
    return v ? `${brand} ${v} ${base}` : `${brand} ${base}`;
  }
  return v ? `${brand} ${v} ${base}` : `${brand} ${base}`;
}

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
    name: "Pintola Natural Peanut Butter",
    brand: "Pintola",
    categoryId: "sauces-spreads-peanut-butter",
    unit: "350 g",
    price: 149,
    mrp: 179,
    emoji: "🥜",
    tags: ["discovery"],
  },
  {
    id: "chia-seeds",
    name: "Urban Platter Chia Seeds",
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
    name: "Happilo California Almonds",
    brand: "Happilo",
    categoryId: "dry-fruits-cereals-dry-fruits",
    unit: "200 g",
    price: 249,
    mrp: 299,
    emoji: "🌰",
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
    id: "nestle-aplus",
    name: "Nestlé a+ Toned Milk",
    brand: "Nestlé",
    categoryId: "dairy-bread-eggs-milk",
    unit: "1 L",
    price: 74,
    mrp: 78,
    emoji: "🥛",
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
    name: "Tata Sampann Toor Dal",
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
    id: "digital-thermometer",
    name: "Dr. Morepen Digital Thermometer",
    brand: "Dr. Morepen",
    categoryId: "health-pharma-health-and-ortho-supports",
    unit: "1 pc",
    price: 199,
    mrp: 299,
    emoji: "🌡️",
    tags: ["discovery"],
  },
  {
    id: "paper-plates",
    name: "Paper Plates",
    brand: "BlinkSelect",
    categoryId: "kitchenware-appliances-tissues-and-disposables",
    unit: "pack of 10",
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
    unit: "pack of 50",
    price: 60,
    mrp: 75,
    emoji: "🥤",
    tags: ["discovery"],
  },
  {
    id: "center-fresh",
    name: "Center Fresh Sugar Free Gum",
    brand: "Center Fresh",
    categoryId: "paan-corner-mouth-fresheners-and-gums",
    unit: "1 pack",
    price: 10,
    mrp: 10,
    emoji: "🍬",
  },
  {
    id: "pampers",
    name: "Pampers Baby Dry",
    brand: "Pampers",
    categoryId: "baby-care-diaper-and-wipes",
    unit: "pack of 54",
    price: 499,
    mrp: 599,
    emoji: "🍼",
  },
  {
    id: "huggies",
    name: "Huggies Wonder Pants",
    brand: "Huggies",
    categoryId: "baby-care-diaper-and-wipes",
    unit: "pack of 28",
    price: 479,
    mrp: 549,
    emoji: "🍼",
  },
  {
    id: "cerelac",
    name: "Nestlé Cerelac Wheat",
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
    id: "pedigree",
    name: "Pedigree Adult Dog Food",
    brand: "Pedigree",
    categoryId: "pet-care-dog-food",
    unit: "1.2 kg",
    price: 350,
    mrp: 399,
    emoji: "🐶",
  },
  {
    id: "whiskas",
    name: "Whiskas Adult Cat Food",
    brand: "Whiskas",
    categoryId: "pet-care-cat-food",
    unit: "480 g",
    price: 180,
    mrp: 210,
    emoji: "🐱",
  },
  {
    id: "me-o",
    name: "Me-O Adult Cat Food",
    brand: "Me-O",
    categoryId: "pet-care-cat-food",
    unit: "1.2 kg",
    price: 320,
    mrp: 360,
    emoji: "🐱",
  },
  {
    id: "dog-treats",
    name: "Pedigree Meat Jerky Treats",
    brand: "Pedigree",
    categoryId: "pet-care-treats",
    unit: "200 g",
    price: 99,
    mrp: 120,
    emoji: "🦴",
  },
  {
    id: "tick-shampoo",
    name: "Himalaya Anti-Tick Pet Shampoo",
    brand: "Himalaya",
    categoryId: "pet-care-grooming",
    unit: "200 ml",
    price: 199,
    mrp: 249,
    emoji: "🧴",
  },
  {
    id: "puppy-pads",
    name: "BlinkSelect Puppy Training Pads",
    brand: "BlinkSelect",
    categoryId: "pet-care-accessories",
    unit: "10 pcs",
    price: 249,
    mrp: 299,
    emoji: "📦",
  },
];

function main() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const l0s = catalog.categories.filter((c) => !c.parent);
  const l1s = catalog.categories.filter((c) => c.parent);

  const products = [];
  const used = new Set();

  for (const l1 of l1s) {
    const l0 = l1.l0 || l1.parent;
    const brands = brandsFor(l0);
    const tint =
      l0s.find((c) => c.id === l0)?.imageTint || l1.imageTint || "#F6F6F6";
    const emoji = l0s.find((c) => c.id === l0)?.emoji || l1.emoji || "🛒";

    for (let i = 0; i < 3; i++) {
      const id = `${l1.id}-${i + 1}`;
      if (used.has(id)) continue;
      used.add(id);
      const brand = brands[(hash(id) + i) % brands.length];
      const price = 20 + (hash(id) % 480);
      const mrp = price + 5 + (hash(id + "m") % 40);
      // Prefer unique packshot SVG path; hero JPG overlay happens in photos script
      const image = `/catalog/products/${id}.svg`;
      products.push({
        id,
        name: makeName(brand, l1.name, i),
        brand,
        categoryId: l1.id,
        unit: unitFor(l0, id),
        price,
        mrp,
        rating: 3.9 + ((hash(id) % 10) / 10),
        ratingCount: 200 + (hash(id) % 50000),
        inStock: true,
        returnWindow: "48-hr return",
        packColor: "#FFFFFF",
        emoji,
        image,
      });
    }
  }

  // Overlay critical demo SKUs (stable IDs) — keep JPG if already downloaded
  for (const c of CRITICAL) {
    const prev = catalog.products.find((p) => p.id === c.id);
    const jpgPath = path.join(ROOT, "public", "catalog", "products", `${c.id}.jpg`);
    const image = fs.existsSync(jpgPath)
      ? `/catalog/products/${c.id}.jpg`
      : `/catalog/products/${c.id}.svg`;
    const full = {
      rating: 4.4,
      ratingCount: 15000,
      inStock: true,
      returnWindow: "48-hr return",
      packColor: "#FFFFFF",
      emoji: c.emoji || "🛒",
      ...c,
      image,
    };
    const idx = products.findIndex((p) => p.id === c.id);
    if (idx >= 0) products[idx] = { ...products[idx], ...full };
    else products.unshift(full);
    used.add(c.id);
  }

  // Keep category images on L0
  for (const c of catalog.categories) {
    if (c.parent) continue;
    const dest = path.join(ROOT, "public", "catalog", "categories", `${c.id}.jpg`);
    if (fs.existsSync(dest)) c.image = `/catalog/categories/${c.id}.jpg`;
  }

  catalog.products = products;
  catalog.meta.product_count = products.length;
  catalog.meta.catalog_rebuilt_at = new Date().toISOString();
  catalog.meta.note =
    "Category-correct brands/units. Heroes use JPG packs; others unique SVG packshots.";

  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n");

  // Sanity samples
  const fem = products.filter((p) => p.categoryId.includes("feminine")).slice(0, 5);
  const drinks = products.filter((p) => p.id === "maaza" || p.id === "sprite");
  console.log("products", products.length);
  console.log(
    "feminine sample",
    fem.map((p) => `${p.brand} | ${p.name} | ${p.unit}`),
  );
  console.log(
    "bad feminine brands?",
    fem.some((p) => /Pedigree|Whiskas|Amul|Kinley|Bikaji|Haldiram/i.test(p.brand)),
  );
  console.log("drinks", drinks.map((p) => p.name));
}

main();
