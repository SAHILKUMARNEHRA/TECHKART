"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { formatINR } from "@/lib/utils";

const tabs = ["Overview", "Orders", "Addresses", "Edit Profile"] as const;

type Tab = (typeof tabs)[number];

export default function ProfilePage() {
  const { user } = useAuth();
  const { orders, addresses, profile, updateProfile } = useCart();
  const [tab, setTab] = useState<Tab>("Overview");
  const [form, setForm] = useState(profile);

  const name = useMemo(
    () => profile.fullName || user?.displayName || "User",
    [profile.fullName, user?.displayName],
  );

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_1fr]">
      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
          Welcome back, {name}
        </p>
        <div className="space-y-1">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                tab === item ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        {tab === "Overview" ? (
          <div>
            <h1 className="text-2xl font-bold">My Account</h1>
            <p className="mt-1 text-sm text-slate-600">{user?.email ?? "Guest"}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Card label="Total Orders" value={String(orders.length)} />
              <Card label="Saved Addresses" value={String(addresses.length)} />
              <Card label="Last Order Value" value={orders[0] ? formatINR(orders[0].total) : "-"} />
            </div>
          </div>
        ) : null}

        {tab === "Orders" ? (
          <div>
            <h2 className="text-xl font-bold">My Orders</h2>
            <div className="mt-3 space-y-2">
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500">No orders yet</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="rounded-lg border border-slate-100 p-3">
                    <p className="font-semibold">{order.id}</p>
                    <p className="text-sm text-slate-600">
                      {order.items.length} items • {formatINR(order.total)} • {order.status}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        {tab === "Addresses" ? (
          <div>
            <h2 className="text-xl font-bold">Saved Addresses</h2>
            <div className="mt-3 space-y-2">
              {addresses.length === 0 ? (
                <p className="text-sm text-slate-500">No address saved</p>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                    {addr.fullName}, {addr.line1}, {addr.city}, {addr.state} - {addr.pincode}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        {tab === "Edit Profile" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              updateProfile(form);
              setTab("Overview");
            }}
            className="space-y-3"
          >
            <h2 className="text-xl font-bold">Edit Profile</h2>
            <input
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="Full Name"
              className="w-full rounded border p-2 text-sm"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone"
              className="w-full rounded border p-2 text-sm"
            />
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              Save Profile
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-100 p-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </article>
  );
}
