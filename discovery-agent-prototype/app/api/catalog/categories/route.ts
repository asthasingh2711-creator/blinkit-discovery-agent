import { NextResponse } from "next/server";
import { getCatalog, getTopLevelCategories } from "@/lib/catalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "1";
  const catalog = getCatalog();

  return NextResponse.json({
    meta: catalog.meta,
    categories: all ? catalog.categories : getTopLevelCategories(),
  });
}
