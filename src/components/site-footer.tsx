import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white/90">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <h3 className="text-base font-semibold text-slate-900">TechKart</h3>
          <p className="mt-2 text-sm text-slate-600">
            Buyer-first electronics discovery with transparent pricing, comparison tools, and price tracking.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900">Explore</h4>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
            <Link href="/products" className="hover:text-blue-700">Products</Link>
            <Link href="/compare" className="hover:text-blue-700">Compare</Link>
            <Link href="/login" className="hover:text-blue-700">Account</Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900">Trust Signals</h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>Live marketplace integration (when API keys are configured)</li>
            <li>Daily stored price snapshots via backend</li>
            <li>No seller dashboard, buyer-only focus</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
