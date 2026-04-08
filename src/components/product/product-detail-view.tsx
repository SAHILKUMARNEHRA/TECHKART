"use client";

import { ArrowLeft, Check, GitCompareArrows } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RatingStars } from "@/components/rating-stars";
import { PriceHistoryChart } from "@/components/product/price-history-chart";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { useCompare } from "@/context/compare-context";
import { formatINR } from "@/lib/utils";
import { Product } from "@/types/product";

export function ProductDetailView({ product }: { product: Product }) {
  const [activeImage, setActiveImage] = useState(product.gallery[0] ?? product.image);
  const { isInCompare, toggleCompare } = useCompare();
  const { addToCart, buyNow } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const selected = isInCompare(product.id);
  const usesGeneratedImage = activeImage.startsWith("/api/product-image/");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
            return;
          }
          router.push("/products");
        }}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <ArrowLeft size={16} />
        Back to Products
      </button>

      <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-2 md:p-6">
        <div>
          <div className="relative mb-3 h-80 overflow-hidden rounded-2xl bg-slate-50">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized={usesGeneratedImage}
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {product.gallery.slice(0, 4).map((image) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(image)}
                className={`relative h-20 overflow-hidden rounded-xl border ${
                  activeImage === image ? "border-blue-500" : "border-slate-200"
                }`}
              >
                <Image
                  src={image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized={image.startsWith("/api/product-image/")}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          {product.bestChoice ? (
            <p className="mb-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Best Choice
            </p>
          ) : null}
          <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
          <p className="mt-1 text-sm text-slate-500">Brand: {product.brand}</p>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <RatingStars rating={product.rating} />
            <span className="font-semibold text-slate-700">{product.rating}</span>
            <span className="text-slate-500">({product.ratingCount} ratings)</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-3xl font-bold text-slate-900">{formatINR(product.price)}</p>
            <p className="text-lg text-slate-400 line-through">{formatINR(product.originalPrice)}</p>
            <p className="rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700">
              {product.discountPercent}% off
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <h3 className="text-sm font-semibold text-blue-900">Available Offers</h3>
            <ul className="mt-2 space-y-2 text-sm text-blue-800">
              {product.offers.map((offer) => (
                <li key={offer.id}>
                  <span className="font-semibold">{offer.title}:</span> {offer.description}
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => toggleCompare(product.id)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            {selected ? <Check size={16} /> : <GitCompareArrows size={16} />}
            {selected ? "Added to Compare" : "Compare"}
          </button>
          <div className="mt-3 grid max-w-md grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  router.push("/login?next=/cart");
                  return;
                }
                addToCart(product);
              }}
              className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900"
            >
              Add to Cart
            </button>
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  router.push("/login?next=/cart");
                  return;
                }
                buyNow(product);
                router.push("/checkout");
              }}
              className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Buy Now
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Specifications</h2>
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(product.specs).map(([key, value]) => (
                <tr key={key} className="border-b border-slate-100 last:border-none">
                  <td className="w-40 py-3 font-medium text-slate-600">{key}</td>
                  <td className="py-3 text-slate-800">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PriceHistoryChart currentPrice={product.price} productId={product.id} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Ratings & Reviews</h2>
        <div className="space-y-4">
          {product.reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-800">{review.author}</p>
                <span className="text-xs text-slate-500">{review.date}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <RatingStars rating={review.rating} />
                <span className="text-sm font-semibold text-slate-700">{review.rating}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
