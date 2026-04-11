import { cache } from "react";
import { fallbackProducts } from "@/lib/fallback-data";
import { Product, ProductCategory, SortOption } from "@/types/product";

const DUMMY_JSON_BASE = "https://dummyjson.com";
const DUMMY_FETCH_TIMEOUT_MS = 3000;
const LIVE_PRODUCTS_HARD_TIMEOUT_MS = 4000;
const MIN_RECENT_RELEASE_YEAR = new Date().getFullYear() - 2;
const TRUSTED_BRANDS = new Set([
  "Apple",
  "Samsung",
  "ASUS",
  "Lenovo",
  "HP",
  "Acer",
  "Dell",
  "OnePlus",
  "Nothing",
  "Xiaomi",
  "Realme",
  "Sony",
  "JBL",
  "boAt",
  "Amazfit",
  "iQOO",
]);

interface DummyProduct {
  id: number;
  title: string;
  brand?: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock?: number;
  thumbnail: string;
  images?: string[];
  description?: string;
}

function normalizeDummyProduct(item: DummyProduct): Product {
  const categoryMap: Record<string, ProductCategory> = {
    smartphones: "Mobiles",
    laptops: "Laptops",
    tablets: "Tablets",
  };

  const category = categoryMap[item.category] ?? "Mobiles";
  const price = Math.round(item.price * 85);
  const discountPercent = Math.max(5, Math.round(item.discountPercentage));
  const originalPrice = Math.round(price / (1 - discountPercent / 100));

  const ramGb = category === "Laptops" ? 16 : category === "Tablets" ? 8 : 8;
  const storageGb = category === "Laptops" ? 512 : 256;

  return {
    id: `d-${item.id}`,
    slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: item.title,
    brand: item.brand ?? "Generic",
    category,
    releaseYear: undefined,
    price,
    originalPrice,
    rating: Number(item.rating.toFixed(1)),
    ratingCount: (item.stock ?? 100) * 19,
    discountPercent,
    image: item.thumbnail,
    gallery: item.images?.length ? item.images.slice(0, 4) : [item.thumbnail],
    shortSpecs: [
      `${ramGb}GB RAM`,
      `${storageGb}GB Storage`,
      `${category === "Mobiles" ? "5000mAh Battery" : "Fast Charging"}`,
      "Warranty Included",
    ],
    specs: {
      Category: category,
      Brand: item.brand ?? "Generic",
      Description: item.description ?? "Popular pick in this category",
      RAM: `${ramGb}GB`,
      Storage: `${storageGb}GB`,
      Warranty: "1 Year Manufacturer Warranty",
    },
    ramGb,
    storageGb,
    bestChoice: discountPercent >= 20 && item.rating >= 4.5,
    trending: item.rating >= 4.6,
    offers: [
      {
        id: "offer-1",
        title: "Instant Discount",
        description: "10% instant discount on select bank cards",
      },
      {
        id: "offer-2",
        title: "No Cost EMI",
        description: "No-cost EMI available for 3 and 6 months",
      },
    ],
    reviews: [
      {
        id: "rw-1",
        author: "Verified Buyer",
        rating: Math.max(4, item.rating - 0.2),
        comment: "Good product quality with smooth overall performance.",
        date: "2026-03-17",
      },
      {
        id: "rw-2",
        author: "Tech Enthusiast",
        rating: item.rating,
        comment: "Worth the price and delivered on time.",
        date: "2026-03-23",
      },
    ],
  };
}

async function fetchDummyProducts(): Promise<Product[]> {
  const categories = ["smartphones", "laptops", "tablets"];
  const results = await Promise.all(
    categories.map(async (category) => {
      const res = await fetch(`${DUMMY_JSON_BASE}/products/category/${category}?limit=30`, {
        next: { revalidate: 1800 },
        signal: AbortSignal.timeout(DUMMY_FETCH_TIMEOUT_MS),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch ${category} products`);
      }

      const data = (await res.json()) as { products: DummyProduct[] };
      return data.products.map(normalizeDummyProduct);
    }),
  );

  return results.flat();
}

function filterTrustedBrands(products: Product[]) {
  return products.filter((item) => TRUSTED_BRANDS.has(item.brand));
}

export function isRecentProduct(product: Product) {
  return (product.releaseYear ?? 0) >= MIN_RECENT_RELEASE_YEAR;
}

function getCuratedProducts() {
  return filterTrustedBrands(fallbackProducts).filter(isRecentProduct);
}

function shouldUseLiveMarketData() {
  if (typeof window !== "undefined") {
    return false;
  }

  const explicitSetting = process.env.TECHKART_ENABLE_LIVE_MARKET?.toLowerCase();
  const hasCredentials = Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);

  if (!hasCredentials) {
    return false;
  }

  if (explicitSetting === "true") {
    return true;
  }

  // Reliability first: keep production stable unless live market data is explicitly enabled.
  return false;
}

async function withHardTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Live data timeout")), timeoutMs);
    }),
  ]);
}

const getProductsCached = cache(async (): Promise<Product[]> => {
  try {
    if (shouldUseLiveMarketData()) {
      try {
        const marketApi = await import("@/lib/server/market-api");
        if (marketApi && marketApi.hasRealMarketConfig()) {
          const liveProducts = await withHardTimeout(
            marketApi.getLiveMarketProducts(12),
            LIVE_PRODUCTS_HARD_TIMEOUT_MS,
          );
          if (liveProducts && liveProducts.length > 0) {
            const byCategory = new Map(
              ["Mobiles", "Laptops", "Tablets", "Smartwatches", "Earbuds"].map((category) => [
                category,
                liveProducts.filter((item) => item.category === category).length,
              ]),
            );
            const boostedFallback = getCuratedProducts().filter((item) => {
              const count = byCategory.get(item.category) ?? 0;
              return count < 10;
            });
            return filterTrustedBrands([...liveProducts, ...boostedFallback]);
          }
        }
      } catch (marketError) {
        console.error("Market API error:", marketError);
      }
    }

    return getCuratedProducts();
  } catch (outerError) {
    console.error("Critical error in getProductsCached:", outerError);
    try {
      const dummyData = await fetchDummyProducts();
      const curatedProducts = getCuratedProducts();
      return filterTrustedBrands([...curatedProducts, ...dummyData.filter(isRecentProduct)]);
    } catch (innerError) {
      console.error("Fallback error:", innerError);
      return getCuratedProducts();
    }
  }
});

export async function getProducts(): Promise<Product[]> {
  return getProductsCached();
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await getProducts();
  const decodedId = decodeURIComponent(id);
  const local = products.find((product) => product.id === decodedId);
  if (local) {
    return local;
  }

  if (typeof window === "undefined" && decodedId.startsWith("ebay-") && shouldUseLiveMarketData()) {
    try {
      const marketApi = await import("@/lib/server/market-api");
      if (marketApi && marketApi.hasRealMarketConfig()) {
        return await marketApi.getLiveProductById(decodedId);
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export function getUniqueValues(products: Product[]) {
  return {
    brands: Array.from(new Set(products.map((item) => item.brand))).sort(),
    ramOptions: Array.from(new Set(products.map((item) => item.ramGb))).sort((a, b) => a - b),
    storageOptions: Array.from(new Set(products.map((item) => item.storageGb))).sort((a, b) => a - b),
  };
}

export function getRecommendedUnder(products: Product[], maxPrice: number) {
  return products
    .filter((item) => item.price <= maxPrice && isRecentProduct(item))
    .sort((a, b) => b.rating - a.rating || b.discountPercent - a.discountPercent)
    .slice(0, 4);
}

export function sortProducts(products: Product[], sortBy: SortOption) {
  const sorted = [...products];

  switch (sortBy) {
    case "priceLowToHigh":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "priceHighToLow":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "ratingHighToLow":
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case "discountHighToLow":
      sorted.sort((a, b) => b.discountPercent - a.discountPercent);
      break;
    default:
      sorted.sort((a, b) => {
        const aScore = a.rating * 12 + a.discountPercent;
        const bScore = b.rating * 12 + b.discountPercent;
        return bScore - aScore;
      });
      break;
  }

  return sorted;
}
