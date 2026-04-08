import { NextResponse } from "next/server";
import { getProductById } from "@/lib/products";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, { params }: RouteProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return NextResponse.json({ ok: false, message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, product });
}
