import {
  getCatalogProduct,
  getProducts,
  getThesisDemoCartIds,
} from "@/lib/catalog";
import type { CatalogProduct } from "@/lib/catalog-types";

export type Product = {
  id: string;
  name: string;
  unit: string;
  price: number;
  mrp?: number;
  packColor: string;
  image?: string;
  emoji: string;
  brand?: string;
  categoryId?: string;
  rating?: number;
  ratingCount?: number;
  returnWindow?: string;
};

export type CartLine = {
  productId: string;
  qty: number;
};

function toProduct(p: CatalogProduct): Product {
  return {
    id: p.id,
    name: p.name,
    unit: p.unit,
    price: p.price,
    mrp: p.mrp,
    packColor: p.packColor,
    image: p.image,
    emoji: p.emoji,
    brand: p.brand,
    categoryId: p.categoryId,
    rating: p.rating,
    ratingCount: p.ratingCount,
    returnWindow: p.returnWindow,
  };
}

/** Map backed by scraped/snapshot Blinkit catalog */
export const PRODUCTS: Record<string, Product> = Object.fromEntries(
  getProducts().map((p) => [p.id, toProduct(p)]),
);

/** Seeded cart — Slide 8 thesis: snacks + drink → novel disposables L0 */
export const DEMO_CART: CartLine[] = getThesisDemoCartIds().map(
  (productId) => ({ productId, qty: 1 }),
);

/** Home / search grid — mission + staples */
export const HOME_PRODUCT_IDS = getProducts({ limit: 12 }).map((p) => p.id);

export function getProduct(id: string): Product | undefined {
  const fromMap = PRODUCTS[id];
  if (fromMap) return fromMap;
  const raw = getCatalogProduct(id);
  return raw ? toProduct(raw) : undefined;
}

export function formatINR(amount: number): string {
  return `₹${amount}`;
}
