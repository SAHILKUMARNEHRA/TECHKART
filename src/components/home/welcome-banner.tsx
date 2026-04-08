"use client";

import { useAuth } from "@/context/auth-context";

export function WelcomeBanner() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
      Welcome back, {user.displayName?.split(" ")[0] ?? "Shopper"}. Great to see you again.
    </section>
  );
}
