export type CatalogCategory = {
  id: string;
  name: string;
  emoji: string;
  imageTint: string;
  l0: string;
  parent?: string;
  /** Local photo for shop-by-category tile, e.g. /catalog/categories/dairy-bread-eggs.jpg */
  image?: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  unit: string;
  price: number;
  mrp: number;
  rating: number;
  ratingCount: number;
  inStock: boolean;
  returnWindow: string;
  packColor: string;
  emoji: string;
  image?: string;
  tags?: string[];
  discoveryTitle?: string;
  savings?: number;
  valueChip?: string;
  affinityLines?: [string, string];
};

export type CatalogMeta = {
  source: string;
  note?: string;
  store_id: string;
  lat: number;
  lon: number;
  scraped_at: string;
  currency: string;
  blinkit_taxonomy_at?: string;
  product_count?: number;
  category_count?: number;
  [key: string]: string | number | undefined;
};

export type BlinkitCatalog = {
  meta: CatalogMeta;
  categories: CatalogCategory[];
  products: CatalogProduct[];
};
