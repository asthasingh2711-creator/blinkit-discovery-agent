import catalogJson from "@/data/blinkit-catalog.json";
import type {
  BlinkitCatalog,
  CatalogCategory,
  CatalogProduct,
} from "@/lib/catalog-types";

const catalog = catalogJson as BlinkitCatalog;

export function getCatalog(): BlinkitCatalog {
  return catalog;
}

export function getCategories(): CatalogCategory[] {
  return catalog.categories;
}

export function getTopLevelCategories(): CatalogCategory[] {
  return catalog.categories.filter((c) => !c.parent);
}

export function getProducts(opts?: {
  categoryId?: string;
  tag?: string;
  q?: string;
  limit?: number;
}): CatalogProduct[] {
  let list = catalog.products.filter((p) => p.inStock);

  if (opts?.categoryId) {
    const cat = opts.categoryId;
    const childIds = new Set(
      catalog.categories
        .filter((c) => c.id === cat || c.parent === cat)
        .map((c) => c.id),
    );
    list = list.filter((p) => childIds.has(p.categoryId));
  }

  if (opts?.tag) {
    list = list.filter((p) => p.tags?.includes(opts.tag!));
  }

  if (opts?.q) {
    const q = opts.q.toLowerCase().trim();
    if (q) {
      list = list.filter((p) => {
        const cat = catalog.categories.find((c) => c.id === p.categoryId);
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.categoryId.toLowerCase().includes(q) ||
          cat?.name.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
        );
      });
    }
  }

  if (opts?.limit) list = list.slice(0, opts.limit);
  return list;
}

export function getCatalogProduct(id: string): CatalogProduct | undefined {
  return catalog.products.find((p) => p.id === id);
}

export function getDiscoverySeedProducts(): CatalogProduct[] {
  return catalog.products.filter((p) => p.tags?.includes("discovery"));
}

export function getBreakfastMissionIds(): string[] {
  return ["amul-taaza-1l", "britannia-bread", "farm-eggs-6"];
}

/**
 * Slide-8 thesis demo: snacks + drink → disposable plates (new L0).
 * Visual novelty is obvious without knowing taxonomy.
 */
export function getThesisDemoCartIds(): string[] {
  return ["lays-classic", "kurkure", "sprite"];
}

export function getStoreStockMap(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const p of catalog.products) map[p.id] = p.inStock;
  return map;
}

export function formatRatingCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K ratings`;
  return `${n} ratings`;
}
