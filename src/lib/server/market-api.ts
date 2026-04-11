import { Product, ProductCategory } from "@/types/product";

const MARKET_FETCH_TIMEOUT_MS = 6000;
const LIVE_PRODUCTS_CACHE_TTL_MS = 15 * 60 * 1000;

function getEbayBaseUrl() {
  const env = process.env.EBAY_ENV?.toLowerCase();
  const clientId = process.env.EBAY_CLIENT_ID ?? "";
  const isSandbox = env === "sandbox" || clientId.includes("-SBX-");
  return isSandbox ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";
}

interface EbayTokenResponse {
  access_token: string;
  expires_in: number;
}

interface EbayItemSummary {
  itemId: string;
  title: string;
  condition?: string;
  price?: {
    value: string;
    currency: string;
  };
  image?: {
    imageUrl: string;
  };
  seller?: {
    username?: string;
  };
}

interface EbaySearchResponse {
  itemSummaries?: EbayItemSummary[];
}

interface EbayItemDetailResponse {
  itemId: string;
  title: string;
  condition?: string;
  price?: {
    value: string;
    currency: string;
  };
  image?: {
    imageUrl: string;
  };
  additionalImages?: Array<{ imageUrl: string }>;
  seller?: {
    username?: string;
  };
}

const TRUSTED_BRANDS = [
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
];

// 30-minute caching for all market data
const CACHE_TTL = 30 * 60 * 1000;
let tokenCache: { token: string; expiry: number } | null = null;
const productsCache = new Map<string, { data: any; timestamp: number }>();
let usdToInrCache: { value: number; expiresAt: number } | null = null;

const categoryQueries: Record<ProductCategory, string[]> = {
  Mobiles: [
    "samsung galaxy s24",
    "apple iphone 17",
    "apple iphone 16",
    "apple iphone 15",
    "samsung galaxy s25",
    "oneplus nord 4",
    "oneplus 13",
    "realme gt 6",
    "iqoo z9 turbo",
    "xiaomi 14 civi",
    "xiaomi 15",
  ],
  Laptops: [
    "macbook air m3 laptop",
    "apple macbook m4",
    "dell xps 14 laptop",
    "lenovo loq laptop",
    "lenovo thinkpad laptop",
    "hp omen laptop",
    "hp omen transcend 14 laptop",
    "asus vivobook s 16 oled laptop",
    "acer swift go 14 laptop",
  ],
  Tablets: [
    "apple ipad pro m4",
    "apple ipad air m2",
    "apple ipad mini a17 pro",
    "samsung galaxy tab s10",
    "samsung galaxy tab s9 fe",
    "oneplus pad 2 tablet",
    "xiaomi pad 7 tablet",
    "lenovo tab plus",
  ],
  Smartwatches: [
    "apple watch series 10",
    "samsung galaxy watch 7",
    "amazfit smartwatch",
    "oneplus watch 3",
    "amazfit balance",
  ],
  Earbuds: [
    "apple airpods pro 2 usb c",
    "samsung galaxy buds3 pro",
    "sony wf 1000xm5",
    "oneplus buds pro 3",
    "nothing ear 2024",
    "jbl live pro 2 earbuds",
    "boat nirvana ion earbuds",
  ],
};

const RECENT_TITLE_PATTERNS: Record<ProductCategory, RegExp[]> = {
  Mobiles: [
    /\biphone (15|16|17)\b/i,
    /\bgalaxy (s24|s25|z fold6|z flip6)\b/i,
    /\bnord 4\b/i,
    /\boneplus 13\b/i,
    /\bgt 6\b/i,
    /\bz9 turbo\b/i,
    /\b14 civi\b/i,
    /\bxiaomi 15\b/i,
    /\bphone \(2a\)\b/i,
  ],
  Laptops: [
    /\bmacbook (air )?m3\b/i,
    /\bmacbook m4\b/i,
    /\bxps 14\b/i,
    /\bloq\b/i,
    /\bomen\b/i,
    /\btranscend 14\b/i,
    /\bvivobook s 16\b/i,
    /\bswift go 14\b/i,
  ],
  Tablets: [
    /\bipad (pro m4|air m2|mini)\b/i,
    /\btab s10\b/i,
    /\btab s9 fe\b/i,
    /\bpad 2\b/i,
    /\bpad 7\b/i,
    /\btab plus\b/i,
  ],
  Smartwatches: [
    /\bwatch series 10\b/i,
    /\bwatch 7\b/i,
    /\bwatch 3\b/i,
    /\bbalance\b/i,
  ],
  Earbuds: [
    /\bairpods pro 2\b/i,
    /\bbuds3 pro\b/i,
    /\bwf[- ]?1000xm5\b/i,
    /\bbuds pro 3\b/i,
    /\bnothing ear\b/i,
    /\blive pro 2\b/i,
    /\bnirvana ion\b/i,
  ],
};

export function hasRealMarketConfig() {
  return Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);
}

async function getEbayToken() {
  if (tokenCache && Date.now() < tokenCache.expiry) {
    return tokenCache.token;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch(`${getEbayBaseUrl()}/identity/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
      next: { revalidate: 1800 }, // 30 minutes Next.js cache
    });

    const data = await response.json() as EbayTokenResponse & { expires_in: number };
    if (data.access_token) {
      tokenCache = {
        token: data.access_token,
        expiry: Date.now() + (data.expires_in - 60) * 1000,
      };
      return data.access_token;
    }
  } catch (error) {
    console.error("eBay token error:", error);
  }
  return null;
}

async function getUsdToInrRate() {
  if (usdToInrCache && usdToInrCache.expiresAt > Date.now()) {
    return usdToInrCache.value;
  }

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(MARKET_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error("Exchange API unavailable");
    }

    const payload = (await response.json()) as { rates?: Record<string, number> };
    const rate = payload.rates?.INR ?? 83;

    usdToInrCache = {
      value: rate,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };

    return rate;
  } catch {
    return 83;
  }
}

function toSlug(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function inferBrand(title: string, fallback: string) {
  const lower = title.toLowerCase();
  const matched = TRUSTED_BRANDS.find((brand) =>
    lower.includes(brand.toLowerCase()),
  );
  return matched ?? fallback;
}

function inferCategoryFromTitle(title: string): ProductCategory {
  const lower = title.toLowerCase();
  if (
    lower.includes("earbud") ||
    lower.includes("airpods") ||
    lower.includes("buds")
  ) {
    return "Earbuds";
  }
  if (
    lower.includes("watch") ||
    lower.includes("smartwatch") ||
    lower.includes("wearable")
  ) {
    return "Smartwatches";
  }
  if (lower.includes("ipad") || lower.includes("tablet") || lower.includes("tab ")) {
    return "Tablets";
  }
  if (
    lower.includes("laptop") ||
    lower.includes("macbook") ||
    lower.includes("notebook")
  ) {
    return "Laptops";
  }
  return "Mobiles";
}

function normalizeToProduct(
  item: EbayItemSummary,
  category: ProductCategory,
  usdToInr: number,
): Product | null {
  const usdPrice = Number(item.price?.value ?? 0);
  if (!usdPrice) {
    return null;
  }

  const price = Math.round(usdPrice * usdToInr);
  const discountPercent = item.condition?.toLowerCase().includes("new") ? 10 : 6;
  const originalPrice = Math.round(price / (1 - discountPercent / 100));

  const ramGb = category === "Laptops" ? 16 : category === "Tablets" ? 8 : 8;
  const storageGb = category === "Laptops" ? 512 : 256;

  const image = item.image?.imageUrl ?? "https://dummyjson.com/image/600x400";
  const releaseYear = inferReleaseYear(item.title, category);
  const rating = inferListingRating(item.title, item.condition);
  const ratingCount = inferRatingCount(item.title);

  return {
    id: `ebay-${item.itemId}`,
    slug: toSlug(item.title),
    name: item.title,
    brand: inferBrand(item.title, item.seller?.username ?? "eBay Seller"),
    category,
    releaseYear,
    price,
    originalPrice,
    rating,
    ratingCount,
    discountPercent,
    image,
    gallery: [image],
    shortSpecs: [
      `${ramGb}GB RAM`,
      `${storageGb}GB Storage`,
      item.condition ?? "New",
      "Global Listing",
    ],
    specs: {
      Source: "eBay Buy Browse API",
      Condition: item.condition ?? "Not specified",
      Category: category,
      Price: `USD ${usdPrice.toFixed(2)}`,
      Marketplace: "eBay",
    },
    ramGb,
    storageGb,
    bestChoice: false,
    trending: false,
    offers: [
      {
        id: "offer-ebay-1",
        title: "Imported Offer",
        description: "Price imported from eBay listing",
      },
    ],
    reviews: [
      {
        id: "review-ebay-1",
        author: "Live Feed",
        rating,
        comment: "Product details are synced from live marketplace API.",
        date: new Date().toISOString().slice(0, 10),
      },
    ],
  };
}

function inferReleaseYear(title: string, category: ProductCategory) {
  const text = title.toLowerCase();
  if (category === "Mobiles") {
    if (/iphone 17|galaxy s25|oneplus 13|xiaomi 15/.test(text)) return 2025;
    if (/iphone 16|iphone 15|galaxy s24|nord 4|gt 6|z9 turbo|14 civi|phone \(2a\)/.test(text)) return 2024;
  }
  if (category === "Laptops") {
    if (/m4/.test(text)) return 2025;
    if (/m3|xps 14|loq|omen|transcend 14|vivobook s 16|swift go 14/.test(text)) return 2024;
  }
  if (category === "Tablets") {
    if (/tab s10|pad 7|ipad mini/.test(text)) return 2025;
    if (/ipad pro m4|ipad air m2|tab s9 fe|pad 2|tab plus/.test(text)) return 2024;
  }
  if (category === "Smartwatches") {
    if (/watch 3/.test(text)) return 2025;
    if (/series 10|watch 7|balance/.test(text)) return 2024;
  }
  if (category === "Earbuds") {
    if (/buds3 pro|buds pro 3/.test(text)) return 2025;
    if (/airpods pro 2|wf[- ]?1000xm5|nothing ear|live pro 2|nirvana ion/.test(text)) return 2024;
  }
  return 2024;
}

function inferListingRating(title: string, condition?: string) {
  const text = title.toLowerCase();
  const conditionText = condition?.toLowerCase() ?? "";
  let rating = 4.15;

  if (conditionText.includes("new")) rating += 0.15;
  if (/pro|max|ultra|elite/.test(text)) rating += 0.2;
  if (/airpods|buds3 pro|wf[- ]?1000xm5|macbook|xps|ipad pro|iphone 16|iphone 17|galaxy s25/.test(text)) {
    rating += 0.15;
  }

  return Math.min(4.9, Number(rating.toFixed(1)));
}

function inferRatingCount(title: string) {
  const text = title.toLowerCase();
  if (/iphone|galaxy|macbook|ipad|airpods/.test(text)) return 4200;
  if (/oneplus|xiaomi|realme|iqoo|lenovo|asus|hp|dell/.test(text)) return 2400;
  return 1200;
}

function isRecentListing(item: EbayItemSummary, category: ProductCategory) {
  const title = item.title.toLowerCase();
  const condition = item.condition?.toLowerCase() ?? "";
  const allowedPatterns = RECENT_TITLE_PATTERNS[category];

  if (!allowedPatterns.some((pattern) => pattern.test(item.title))) {
    return false;
  }

  if (/used|refurbished|broken|parts only|for parts|read description|cracked/.test(title)) {
    return false;
  }

  if (condition && /(used|seller refurbished|for parts)/.test(condition)) {
    return false;
  }

  return true;
}

function scoreListing(title: string, category: ProductCategory) {
  const text = title.toLowerCase();
  const brandBoost = TRUSTED_BRANDS.some((brand) =>
    text.includes(brand.toLowerCase()),
  )
    ? 12
    : 0;
  const newBoost = text.includes("new") || text.includes("latest") ? 4 : 0;
  const generationBoost =
    category === "Mobiles"
      ? Number(
          /\b(iphone 17|iphone 16|s25|oneplus 13|xiaomi 15)\b/i.test(title),
        ) * 6
      : category === "Tablets"
        ? Number(/\b(tab s10|ipad pro m4|ipad air)\b/i.test(title)) * 6
        : category === "Laptops"
          ? Number(/\b(m4|xps|thinkpad|vivobook|omen)\b/i.test(title)) * 6
          : category === "Smartwatches"
            ? Number(/\b(series 10|watch 7|watch 2)\b/i.test(title)) * 6
            : Number(/\b(airpods|buds3|wf-?1000xm5)\b/i.test(title)) * 6;

  return brandBoost + newBoost + generationBoost;
}

async function fetchCategoryProducts(
  token: string,
  category: ProductCategory,
  limit: number,
): Promise<Product[]> {
  const queries = categoryQueries[category].slice(0, 3);
  const responses = await Promise.allSettled(
    queries.map(async (query) => {
      const url = new URL(`${getEbayBaseUrl()}/buy/browse/v1/item_summary/search`);
      url.searchParams.set("q", query);
      url.searchParams.set("limit", String(Math.max(6, limit)));

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
          Accept: "application/json",
        },
        next: { revalidate: 1800 },
        signal: AbortSignal.timeout(MARKET_FETCH_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`Failed eBay fetch for ${category}`);
      }

      const payload = (await response.json()) as EbaySearchResponse;
      return payload.itemSummaries ?? [];
    }),
  );

  const summaries = responses
    .filter(
      (
        result,
      ): result is PromiseFulfilledResult<EbayItemSummary[]> =>
        result.status === "fulfilled",
    )
    .flatMap((result) => result.value);

  const unique = Array.from(
    new Map(summaries.map((item) => [item.itemId, item])).values(),
  );
  const usdToInr = await getUsdToInrRate();

  return unique
    .filter((item) => isRecentListing(item, category))
    .sort(
      (a, b) =>
        scoreListing(b.title, category) - scoreListing(a.title, category),
    )
    .map((item) => normalizeToProduct(item, category, usdToInr))
    .filter((product): product is Product => Boolean(product))
    .slice(0, Math.max(limit, 14));
}

export async function getLiveMarketProducts(count = 12) {
  const cacheKey = `products-${count}`;
  const cached = productsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const token = await getEbayToken();
  if (!token) return [];

  try {
    const response = await fetch(
      `${getEbayBaseUrl()}/buy/browse/v1/item_summary/search?q=smartphone+laptop&limit=${count}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 1800 },
      },
    );

    const data = await response.json() as EbaySearchResponse;
    const usdToInr = await getUsdToInrRate();
    const products = (data.itemSummaries || [])
      .map(item => normalizeToProduct(item, inferCategoryFromTitle(item.title), usdToInr))
      .filter((p): p is Product => p !== null);
      
    productsCache.set(cacheKey, { data: products, timestamp: Date.now() });
    return products;
  } catch (error) {
    console.error("eBay search error:", error);
    return [];
  }
}

export async function getLiveProductById(id: string): Promise<Product | undefined> {
  try {
    const token = await getEbayToken();
    if (!token) return undefined;
    const rawItemId = decodeURIComponent(id).replace(/^ebay-/, "");
    const endpoint = `${getEbayBaseUrl()}/buy/browse/v1/item/${encodeURIComponent(rawItemId)}`;
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        Accept: "application/json",
      },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(MARKET_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return undefined;
    }

    const item = (await response.json()) as EbayItemDetailResponse;
    const usdToInr = await getUsdToInrRate();
    const category = inferCategoryFromTitle(item.title);
    const normalized = normalizeToProduct(
      {
        itemId: item.itemId,
        title: item.title,
        condition: item.condition,
        price: item.price,
        image: item.image,
        seller: item.seller,
      },
      category,
      usdToInr,
    );

    if (!normalized) {
      return undefined;
    }

    const extraGallery = item.additionalImages?.map((entry) => entry.imageUrl) ?? [];
    return {
      ...normalized,
      gallery: [normalized.image, ...extraGallery].filter(Boolean).slice(0, 6),
    };
  } catch (error) {
    console.error("Critical error in getLiveProductById:", error);
    return undefined;
  }
}
