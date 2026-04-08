import Link from "next/link";
import { ProductDetailView } from "@/components/product/product-detail-view";
import { getProductById } from "@/lib/products";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-900">Product not found</h1>
        <p className="mt-3 text-slate-600">Please return to product listing and choose another product.</p>
        <Link href="/products" className="mt-6 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
          Back to Products
        </Link>
      </div>
    );
  }

  return <ProductDetailView product={product} />;
}
