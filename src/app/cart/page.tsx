"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { formatINR } from "@/lib/utils";

export default function CartPage() {
  const { user, loading } = useAuth();
  const { cartItems, cartTotal, updateQuantity, removeFromCart } = useCart();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!mounted || loading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center">Loading cart...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Login first to use cart</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your cart and checkout are available only after sign-in.
        </p>
        <Link
          href="/login?next=/cart"
          className="mt-4 inline-flex rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Login Now
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/products" className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        {cartItems.map((item) => (
          <article key={item.product.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-900">{item.product.name}</p>
            <p className="mt-1 text-sm text-slate-500">{item.product.brand}</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="font-bold text-slate-900">{formatINR(item.product.price)}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="rounded border px-2">-</button>
                <span className="text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="rounded border px-2">+</button>
                <button onClick={() => removeFromCart(item.product.id)} className="ml-3 text-sm font-semibold text-rose-600">Remove</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Price Summary</h2>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span>Total</span>
          <span className="font-bold">{formatINR(cartTotal)}</span>
        </div>
        <Link href="/checkout" className="mt-4 inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
          Proceed to Checkout
        </Link>
      </aside>
    </div>
  );
}
