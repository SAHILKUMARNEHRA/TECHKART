"use client";

import { SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { useCompare } from "@/context/compare-context";
import { formatINR } from "@/lib/utils";
import { Product, SortOption } from "@/types/product";
import { sortProducts } from "@/lib/products";

interface ListingShellProps {
  products: Product[];
  defaultSearch?: string;
  defaultCategory?: string;
}

export function ListingShell({
  products,
  defaultSearch = "",
  defaultCategory,
}: ListingShellProps) {
  const [search, setSearch] = useState(defaultSearch);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(120000);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [ramOptions, setRamOptions] = useState<number[]>([]);
  const [storageOptions, setStorageOptions] = useState<number[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(
    defaultCategory ? [defaultCategory] : [],
  );
  const [showFilters, setShowFilters] = useState(false);
  const { compareIds } = useCompare();
  const categories = useMemo(
    () => Array.from(new Set(products.map((item) => item.category))).sort(),
    [products],
  );

  const brands = useMemo(
    () => Array.from(new Set(products.map((item) => item.brand))).sort(),
    [products],
  );
  const ramChoices = useMemo(
    () => Array.from(new Set(products.map((item) => item.ramGb))).sort((a, b) => a - b),
    [products],
  );
  const storageChoices = useMemo(
    () =>
      Array.from(new Set(products.map((item) => item.storageGb))).sort(
        (a, b) => a - b,
      ),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();

    const filtered = products.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query) ||
        item.shortSpecs.join(" ").toLowerCase().includes(query);

      const matchesPrice = item.price >= minPrice && item.price <= maxPrice;
      const matchesBrand =
        selectedBrands.length === 0 || selectedBrands.includes(item.brand);
      const matchesRating = item.rating >= minRating;
      const matchesRam = ramOptions.length === 0 || ramOptions.includes(item.ramGb);
      const matchesStorage =
        storageOptions.length === 0 || storageOptions.includes(item.storageGb);
      const matchesCategory =
        categoryOptions.length === 0 || categoryOptions.includes(item.category);

      return (
        matchesSearch &&
        matchesPrice &&
        matchesBrand &&
        matchesRating &&
        matchesRam &&
        matchesStorage &&
        matchesCategory
      );
    });

    return sortProducts(filtered, sortBy);
  }, [
    maxPrice,
    minPrice,
    minRating,
    products,
    ramOptions,
    search,
    selectedBrands,
    sortBy,
    storageOptions,
    categoryOptions,
  ]);

  const toggle = <T,>(value: T, list: T[], setter: (next: T[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
      return;
    }
    setter([...list, value]);
  };

  useEffect(() => {
    setSearch(defaultSearch);
  }, [defaultSearch]);

  useEffect(() => {
    setCategoryOptions(defaultCategory ? [defaultCategory] : []);
  }, [defaultCategory]);

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <aside className={`w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 ${showFilters ? "block" : "hidden lg:block"}`}>
        <h3 className="text-lg font-semibold text-slate-900">Filters</h3>

        <div className="mt-4 space-y-5 text-sm">
          <div>
            <p className="mb-2 font-semibold text-slate-800">Price Range</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={minPrice}
                min={0}
                onChange={(event) => setMinPrice(Number(event.target.value || 0))}
                className="rounded-lg border border-slate-200 px-2 py-1.5"
                placeholder="Min"
              />
              <input
                type="number"
                value={maxPrice}
                min={0}
                onChange={(event) => setMaxPrice(Number(event.target.value || 0))}
                className="rounded-lg border border-slate-200 px-2 py-1.5"
                placeholder="Max"
              />
            </div>
          </div>

          <FilterGroup title="Brand">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggle(brand, selectedBrands, setSelectedBrands)}
                />
                {brand}
              </label>
            ))}
          </FilterGroup>

          <div>
            <p className="mb-2 font-semibold text-slate-800">Minimum Rating</p>
            <select
              value={minRating}
              onChange={(event) => setMinRating(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
            >
              <option value={0}>All Ratings</option>
              <option value={3.5}>3.5+</option>
              <option value={4}>4.0+</option>
              <option value={4.3}>4.3+</option>
            </select>
          </div>

          <FilterGroup title="RAM">
            {ramChoices.map((ram) => (
              <label key={ram} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={ramOptions.includes(ram)}
                  onChange={() => toggle(ram, ramOptions, setRamOptions)}
                />
                {ram}GB
              </label>
            ))}
          </FilterGroup>

          <FilterGroup title="Storage">
            {storageChoices.map((storage) => (
              <label key={storage} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={storageOptions.includes(storage)}
                  onChange={() => toggle(storage, storageOptions, setStorageOptions)}
                />
                {storage}GB
              </label>
            ))}
          </FilterGroup>

          <FilterGroup title="Category">
            {categories.map((category) => (
              <label key={category} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={categoryOptions.includes(category)}
                  onChange={() =>
                    toggle(category, categoryOptions, setCategoryOptions)
                  }
                />
                {category}
              </label>
            ))}
          </FilterGroup>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 lg:hidden"
          >
            <SlidersHorizontal size={15} /> Filters
          </button>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search in results"
            className="h-10 min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 text-sm"
          />

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="priceLowToHigh">Price: Low to High</option>
            <option value="priceHighToLow">Price: High to Low</option>
            <option value="ratingHighToLow">Rating: High to Low</option>
            <option value="discountHighToLow">Discount: High to Low</option>
          </select>

          <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
            {filteredProducts.length} products
          </span>
        </div>

        {compareIds.length > 0 ? (
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {compareIds.length} selected for compare. Choose up to 4 products and open compare page.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            No products match your current filters. Try widening price or rating.
          </div>
        ) : null}

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
          Price range active: {formatINR(minPrice)} - {formatINR(maxPrice)}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 font-semibold text-slate-800">{title}</p>
      <div className="space-y-1.5 text-slate-600">{children}</div>
    </div>
  );
}
