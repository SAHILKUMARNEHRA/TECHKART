"use client";

import { Check, GitCompareArrows } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RatingStars } from "@/components/rating-stars";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { useCompare } from "@/context/compare-context";
import { formatINR } from "@/lib/utils";
import { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isInCompare, toggleCompare, maxReached } = useCompare();
  const { addToCart, buyNow } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const selected = isInCompare(product.id);
  const usesGeneratedImage = product.image.startsWith("/api/product-image/");

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_6px_24px_-20px_rgba(15,23,42,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_-20px_rgba(0,87,217,0.4)]">
      <Link href={`/products/${product.id}`} className="block overflow-hidden rounded-xl bg-slate-50">
        <div className="relative h-44 w-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 300px"
            unoptimized={usesGeneratedImage}
          />
        </div>
      </Link>

      <div className="mt-3 space-y-2">
        {product.bestChoice ? (
          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Best Choice
          </span>
        ) : null}

        <Link href={`/products/${product.id}`} className="line-clamp-2 text-sm font-semibold text-slate-800">
          {product.name}
        </Link>

        <div className="flex items-center gap-2 text-xs">
          <RatingStars rating={product.rating} />
          <span className="font-semibold text-slate-700">{product.rating}</span>
          <span className="text-slate-500">({product.ratingCount})</span>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-slate-900">{formatINR(product.price)}</p>
          <p className="text-sm text-slate-400 line-through">{formatINR(product.originalPrice)}</p>
          <p className="text-sm font-semibold text-emerald-600">{product.discountPercent}% off</p>
        </div>

        <ul className="space-y-1 text-xs text-slate-600">
          {product.shortSpecs.slice(0, 3).map((spec) => (
            <li key={spec}>• {spec}</li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => toggleCompare(product.id)}
          disabled={maxReached && !selected}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {selected ? <Check size={16} /> : <GitCompareArrows size={16} />}
          {selected ? "Added to Compare" : "Compare"}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              if (!user) {
                router.push("/login?next=/cart");
                return;
              }
              addToCart(product);
            }}
            className="rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
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
            className="rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Buy Now
          </button>
        </div>
      </div>
    </article>
  );
}
