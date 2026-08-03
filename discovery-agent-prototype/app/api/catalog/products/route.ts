import { NextResponse } from "next/server";
import { getCatalog, getCatalogProduct, getProducts } from "@/lib/catalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const categoryId = searchParams.get("category") ?? undefined;
  const tag = searchParams.get("tag") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const limit = searchParams.get("limit")
    ? Number(searchParams.get("limit"))
    : undefined;

  if (id) {
    const product = getCatalogProduct(id);
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ product, meta: getCatalog().meta });
  }

  return NextResponse.json({
    meta: getCatalog().meta,
    products: getProducts({ categoryId, tag, q, limit }),
  });
}
