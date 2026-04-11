import { ListingShell } from "@/components/products/listing-shell";
import { getProducts } from "@/lib/products";

interface ProductsPageProps {
  searchParams: Promise<{ search?: string; category?: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const [products, params] = await Promise.all([getProducts(), searchParams]);

  return (
    <ListingShell
      products={products}
      defaultSearch={params.search ?? ""}
      defaultCategory={params.category}
    />
  );
}
