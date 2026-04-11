import { NextRequest, NextResponse } from "next/server";
import { getProducts, sortProducts } from "@/lib/products";
import { SortOption } from "@/types/product";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const search = (searchParams.get("search") ?? "").toLowerCase();
  const category = searchParams.get("category") ?? "";
  const sort = (searchParams.get("sort") as SortOption | null) ?? "relevance";
  const minPrice = Number(searchParams.get("minPrice") ?? 0);
  const maxPrice = Number(searchParams.get("maxPrice") ?? Number.MAX_SAFE_INTEGER);

  const products = await getProducts();

  const filtered = products.filter((product) => {
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search) ||
      product.brand.toLowerCase().includes(search) ||
      product.shortSpecs.join(" ").toLowerCase().includes(search);

    const matchesCategory = !category || product.category === category;
    const matchesPrice = product.price >= minPrice && product.price <= maxPrice;

    return matchesSearch && matchesCategory && matchesPrice;
  });

  return NextResponse.json({
    ok: true,
    count: filtered.length,
    products: sortProducts(filtered, sort),
  });
}
