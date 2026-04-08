"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { formatINR } from "@/lib/utils";

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const { orders } = useCart();
  const order = orders.find((item) => item.id === params.id);

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Link href="/profile" className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          Go to Profile
        </Link>
      </div>
    );
  }

  const deliveryDays = 2 + (order.items.length % 3);
  const eta = new Date(order.createdAt);
  eta.setDate(eta.getDate() + deliveryDays);
  const etaDate = eta.toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-blue-50 p-5">
        <h1 className="text-2xl font-bold text-emerald-800">Great! Your order is confirmed.</h1>
        <p className="mt-1 text-sm text-emerald-700">Welcome back. Your order is placed successfully.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-white p-3 text-sm">
            <p className="text-slate-500">Order ID</p>
            <p className="font-semibold text-slate-900">{order.id}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-white p-3 text-sm">
            <p className="text-slate-500">Delivery ETA</p>
            <p className="font-semibold text-slate-900">{etaDate}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-white p-3 text-sm">
            <p className="text-slate-500">Status</p>
            <p className="font-semibold text-slate-900">{order.status}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-emerald-700">
          If any issue, contact your delivery partner from order help center.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Order Items</h2>
        <div className="mt-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.product.id} className="rounded-lg border border-slate-100 p-3">
              <p className="font-semibold text-slate-900">{item.product.name}</p>
              <p className="text-sm text-slate-600">
                Qty: {item.quantity} • {formatINR(item.product.price)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p><span className="font-semibold">Total:</span> {formatINR(order.total)}</p>
        <p><span className="font-semibold">Payment:</span> {order.paymentMode}</p>
        <p><span className="font-semibold">Expected Delivery:</span> in {deliveryDays} days ({etaDate})</p>
        <p>
          <span className="font-semibold">Delivery Address:</span> {order.address.fullName}, {order.address.line1}, {order.address.city}, {order.address.state} - {order.address.pincode}
        </p>
      </section>
    </div>
  );
}
