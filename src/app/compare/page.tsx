import { CompareShell } from "@/components/products/compare-shell";
import { getProducts } from "@/lib/products";

export default async function ComparePage() {
  const products = await getProducts();
  return <CompareShell products={products} />;
}
