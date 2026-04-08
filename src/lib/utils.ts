import { Product } from "@/types/product";

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function toStars(rating: number) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return { full, hasHalf, empty };
}

export function getPriceBucketSections(products: Product[]) {
  const buckets = [15000, 20000, 30000, 50000];

  return buckets.map((amount) => ({
    amount,
    products: products
      .filter((item) => item.price <= amount)
      .sort((a, b) => b.rating - a.rating || b.discountPercent - a.discountPercent)
      .slice(0, 4),
  }));
}
