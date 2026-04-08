"use client";

import { Shield, ShieldOff } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { formatINR } from "@/lib/utils";

export default function AdminPage() {
  const { user, loading, isAdmin, authLogs, blockedUsers, toggleBlockedUser } = useAuth();
  const { orders, activities, cartItems } = useCart();

  const stats = useMemo(() => {
    const totalUnitsSold = orders.reduce(
      (sum, order) => sum + order.items.reduce((acc, item) => acc + item.quantity, 0),
      0,
    );
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalProductsInCart = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueCustomers = new Set(authLogs.map((entry) => entry.email)).size;
    const activeLogins = authLogs.filter((entry) => entry.action === "login").length;

    return {
      totalUnitsSold,
      totalRevenue,
      totalProductsInCart,
      uniqueCustomers,
      activeLogins,
    };
  }, [authLogs, cartItems, orders]);

  const users = useMemo(() => {
    const map = new Map<
      string,
      {
        email: string;
        displayName: string;
        lastLoginAt?: string;
        provider?: string;
        loginCount: number;
        blocked: boolean;
      }
    >();

    for (const log of authLogs) {
      const existing = map.get(log.email) ?? {
        email: log.email,
        displayName: log.displayName,
        loginCount: 0,
        blocked: blockedUsers.includes(log.email),
      };

      if (log.action === "login") {
        existing.lastLoginAt = log.createdAt;
        existing.provider = log.provider;
        existing.loginCount += 1;
      }

      existing.displayName = log.displayName || existing.displayName;
      existing.blocked = blockedUsers.includes(log.email);
      map.set(log.email, existing);
    }

    return Array.from(map.values()).sort((a, b) =>
      (b.lastLoginAt ?? "").localeCompare(a.lastLoginAt ?? ""),
    );
  }, [authLogs, blockedUsers]);

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center">Loading admin access...</div>;
  }

  if (!user || !isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Admin access only</h1>
        <p className="mt-2 text-sm text-slate-600">
          This page is visible only for the configured admin account.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Admin Console</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">TechKart Operations Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Signed in as {user.email}. This panel is hidden for non-admin accounts.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card label="Products in cart" value={String(stats.totalProductsInCart)} />
        <Card label="Total orders" value={String(orders.length)} />
        <Card label="Units sold" value={String(stats.totalUnitsSold)} />
        <Card label="Revenue" value={formatINR(stats.totalRevenue)} />
        <Card label="Known users" value={String(stats.uniqueCustomers)} />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">User access log</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {stats.activeLogins} login events
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {users.length === 0 ? (
              <p className="text-sm text-slate-500">No user logins recorded yet.</p>
            ) : (
              users.map((entry) => (
                <div
                  key={entry.email}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{entry.displayName || entry.email}</p>
                    <p className="text-sm text-slate-600">{entry.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Last login:{" "}
                      {entry.lastLoginAt
                        ? new Date(entry.lastLoginAt).toLocaleString()
                        : "No successful login"}{" "}
                      • Provider: {entry.provider ?? "n/a"} • Count: {entry.loginCount}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleBlockedUser(entry.email)}
                    disabled={entry.email === user.email}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      entry.blocked
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {entry.blocked ? <ShieldOff size={16} /> : <Shield size={16} />}
                    {entry.blocked ? "Unblock user" : "Block user"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Blocked accounts</h2>
            <div className="mt-4 space-y-2 text-sm">
              {blockedUsers.length === 0 ? (
                <p className="text-slate-500">No blocked users.</p>
              ) : (
                blockedUsers.map((email) => (
                  <div key={email} className="rounded-xl border border-slate-100 px-3 py-2 text-slate-700">
                    {email}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Application activity</h2>
            <div className="mt-4 space-y-2 text-sm">
              {activities.slice(0, 12).map((activity) => (
                <div key={activity.id} className="rounded-xl border border-slate-100 p-3">
                  <p className="font-medium text-slate-800">{activity.message}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {activities.length === 0 ? (
                <p className="text-slate-500">No activity yet.</p>
              ) : null}
            </div>
          </section>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent order summary</h2>
        <div className="mt-4 space-y-3">
          {orders.slice(0, 10).map((order) => (
            <div key={order.id} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{order.id}</p>
                  <p className="text-sm text-slate-600">
                    {order.items.length} line items • {order.paymentMode} • {order.status}
                  </p>
                </div>
                <div className="text-sm font-semibold text-slate-900">{formatINR(order.total)}</div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {order.address.fullName}, {order.address.city}, {order.address.state} •{" "}
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {orders.length === 0 ? <p className="text-sm text-slate-500">No orders placed yet.</p> : null}
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
