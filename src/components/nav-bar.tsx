"use client";

import { ChevronDown, LogOut, Moon, Search, ShoppingCart, Sun, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { useCompare } from "@/context/compare-context";
import { TechKartLogo } from "@/components/logo";

const topCategories = [
  { label: "Smartphones", value: "Mobiles" },
  { label: "Tablets", value: "Tablets" },
  { label: "Laptops", value: "Laptops" },
  { label: "Smartwatches", value: "Smartwatches" },
  { label: "Earbuds", value: "Earbuds" },
];

export function NavBar() {
  const [query, setQuery] = useState("");
  const [authError, setAuthError] = useState("");
  const [dark, setDark] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, logout, authError: authStateError } = useAuth();
  const { compareIds } = useCompare();
  const { cartCount } = useCart();
  const accountRef = useRef<HTMLDivElement | null>(null);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
  };

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(`/products?search=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <TechKartLogo />

        <form onSubmit={onSearch} className="relative mx-2 hidden flex-1 md:block">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search mobiles, laptops, tablets..."
            className="h-11 w-full rounded-xl border border-cyan-100 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none ring-cyan-500 transition focus:ring-2"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href="/compare"
            className="rounded-xl border border-cyan-100 px-3 py-2 text-sm font-medium text-cyan-700 transition hover:bg-cyan-50"
          >
            Compare ({mounted ? compareIds.length : 0})
          </Link>

          <button
            type="button"
            onClick={() => {
              if (!user) {
                router.push("/login?next=/cart");
                return;
              }
              router.push("/cart");
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ShoppingCart size={16} /> Cart ({mounted ? cartCount : 0})
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl border border-cyan-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => {
                setAuthError("");
                setAccountOpen((prev) => !prev);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-white">
                <User size={16} />
              </span>
              <span className="hidden sm:block">
                {user ? user.displayName?.split(" ")[0] ?? "Account" : "Account"}
              </span>
              <ChevronDown size={16} className={`transition ${accountOpen ? "rotate-180" : ""}`} />
            </button>

            {accountOpen ? (
              <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.35)]">
                {user ? (
                  <>
                    <div className="border-b border-slate-100 px-3 py-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {user.displayName ?? "TechKart Account"}
                      </p>
                      <p className="truncate text-xs text-slate-500">{user.email ?? "Signed in"}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setAccountOpen(false)}
                      className="mt-1 block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      My Profile
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        setAuthError("");
                        setAccountOpen(false);
                      }}
                      className="mt-1 inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <p className="px-3 py-2 text-sm text-slate-600">
                      Sign in to manage your cart, orders, and profile.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
                      }}
                      className="mt-1 w-full rounded-xl bg-cyan-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
                    >
                      Login / Sign Up
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/80">
        <div className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
          {topCategories.map((category) => (
            <Link
              key={category.value}
              href={`/products?category=${encodeURIComponent(category.value)}`}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-cyan-100 hover:text-cyan-700"
            >
              {category.label}
            </Link>
          ))}
          <Link
            href="/products"
            className="ml-auto shrink-0 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white"
          >
            Browse Products
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              className="shrink-0 rounded-lg border border-cyan-200 px-3 py-1.5 text-sm font-semibold text-cyan-700"
            >
              Admin
            </Link>
          ) : null}
        </div>
      </div>
      {authError || authStateError ? (
        <p className="border-t border-cyan-100 bg-cyan-50 px-4 py-2 text-center text-xs font-medium text-cyan-900">
          {authError || authStateError}
        </p>
      ) : null}
    </header>
  );
}
