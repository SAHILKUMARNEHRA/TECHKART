import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/products";
import { getOrCreatePriceHistory } from "@/lib/server/price-history-store";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const rangeRaw = Number(new URL(request.url).searchParams.get("range") ?? 30);
  const range = rangeRaw === 90 ? 90 : 30;

  const product = await getProductById(id);

  if (!product) {
    return NextResponse.json({ ok: false, message: "Product not found" }, { status: 404 });
  }

  const history = await getOrCreatePriceHistory(product.id, product.price, range);

  return NextResponse.json({
    ok: true,
    productId: product.id,
    range,
    currency: "INR",
    history,
  });
}
