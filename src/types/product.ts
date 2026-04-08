export type ProductCategory =
  | "Mobiles"
  | "Laptops"
  | "Tablets"
  | "Smartwatches"
  | "Earbuds";

export interface Offer {
  id: string;
  title: string;
  description: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  releaseYear?: number;
  price: number;
  originalPrice: number;
  rating: number;
  ratingCount: number;
  discountPercent: number;
  image: string;
  gallery: string[];
  shortSpecs: string[];
  specs: Record<string, string>;
  ramGb: number;
  storageGb: number;
  bestChoice?: boolean;
  trending?: boolean;
  offers: Offer[];
  reviews: Review[];
}

export interface ProductFilters {
  minPrice: number;
  maxPrice: number;
  brands: string[];
  minRating: number;
  ramOptions: number[];
  storageOptions: number[];
  categories: ProductCategory[];
}

export type SortOption =
  | "relevance"
  | "priceLowToHigh"
  | "priceHighToLow"
  | "ratingHighToLow"
  | "discountHighToLow";
