"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCompare } from "@/context/compare-context";
import { formatINR } from "@/lib/utils";
import { Product } from "@/types/product";

export function CompareShell({ products }: { products: Product[] }) {
  const { compareIds, clearCompare } = useCompare();
  const compareProducts = useMemo(
    () => products.filter((item) => compareIds.includes(item.id)),
    [compareIds, products],
  );

  if (compareProducts.length < 2) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-900">Compare Products</h1>
        <p className="mt-3 text-slate-600">
          Select at least 2 products from listing/detail pages to compare side by side.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Go to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Compare ({compareProducts.length})</h1>
        <button
          type="button"
          onClick={clearCompare}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
        >
          Clear
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-[760px] w-full text-sm">
          <tbody>
            <Row
              label="Product"
              values={compareProducts.map((item) => (
                <div key={item.id} className="font-semibold text-slate-900">{item.name}</div>
              ))}
            />
            <Row label="Price" values={compareProducts.map((item) => formatINR(item.price))} />
            <Row label="Rating" values={compareProducts.map((item) => `${item.rating} / 5`)} />
            <Row label="Discount" values={compareProducts.map((item) => `${item.discountPercent}% off`)} />
            <Row label="Brand" values={compareProducts.map((item) => item.brand)} />
            <Row label="RAM" values={compareProducts.map((item) => `${item.ramGb}GB`)} />
            <Row label="Storage" values={compareProducts.map((item) => `${item.storageGb}GB`)} />
            <Row
              label="Top Specs"
              values={compareProducts.map((item) => item.shortSpecs.join(" • "))}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ label, values }: { label: string; values: React.ReactNode[] }) {
  return (
    <tr className="border-b border-slate-100 last:border-none">
      <td className="w-44 bg-slate-50 px-4 py-3 font-semibold text-slate-700">{label}</td>
      {values.map((value, idx) => (
        <td key={`${label}-${idx}`} className="px-4 py-3 align-top text-slate-700">
          {value}
        </td>
      ))}
    </tr>
  );
}
