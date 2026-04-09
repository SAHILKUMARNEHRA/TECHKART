import { Suspense } from "react";
import Link from "next/link";
import { TechNewsSection } from "@/components/home/tech-news-section";
import { WelcomeBanner } from "@/components/home/welcome-banner";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/products";
import { getPriceBucketSections } from "@/lib/utils";

const categories = [
  { name: "Smartphones", href: "/products?category=Mobiles" },
  { name: "Laptops", href: "/products?category=Laptops" },
  { name: "Tablets", href: "/products?category=Tablets" },
  { name: "Smartwatches", href: "/products?category=Smartwatches" },
  { name: "Earbuds", href: "/products?category=Earbuds" },
];
const stats = [
  { label: "Live Categories", value: "4" },
  { label: "Compare Limit", value: "Up to 4" },
  { label: "Price Snapshots", value: "Daily" },
];

export default async function HomePage() {
  const products = (await getProducts()) || [];
  const trending = products.filter((item) => item.trending).slice(0, 8);
  const buckets = getPriceBucketSections(products);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <WelcomeBanner />
      <section className="rounded-3xl bg-[linear-gradient(125deg,#0057d9,#4aa3ff)] p-6 text-white shadow-[0_24px_60px_-30px_rgba(0,87,217,0.65)] md:p-10">
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="mb-2 text-sm font-medium text-blue-100">Buyer-Only Electronics Platform</p>
            <h1 className="max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
              Discover the latest electronics deals, comparisons, and price insights with TechKart.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-blue-100 md:text-base">
              Compare products side by side, explore price trends, and browse trusted electronics across categories.
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700"
            >
              Explore Products
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/15 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-blue-100">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={category.href}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            {category.name}
          </Link>
        ))}
      </section>

      {buckets.map((bucket) => (
        <Section key={bucket.amount} title={`Best under ₹${bucket.amount.toLocaleString("en-IN")}`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {bucket.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Section>
      ))}

      <Section title="Trending Products">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {trending.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Section>

      <Suspense fallback={<div className="h-48 w-full animate-pulse rounded-2xl bg-slate-100" />}>
        <TechNewsSection />
      </Suspense>

    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <Link href="/products" className="text-sm font-semibold text-blue-700 hover:underline">
          View all
        </Link>
      </div>
      {children}
    </section>
  );
}
