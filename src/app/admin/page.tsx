"use client";

import { useCart } from "@/context/cart-context";

export default function AdminPage() {
  const { orders, activities, cartItems } = useCart();

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold">Admin Activity Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card label="Active cart items" value={String(cartItems.length)} />
        <Card label="Total orders" value={String(orders.length)} />
        <Card label="Activity logs" value={String(activities.length)} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <div className="mt-3 space-y-2 text-sm">
          {activities.slice(0, 30).map((activity) => (
            <div key={activity.id} className="rounded border border-slate-100 p-2">
              <p className="font-medium text-slate-800">{activity.message}</p>
              <p className="text-xs text-slate-500">{new Date(activity.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </article>
  );
}
