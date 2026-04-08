import Link from "next/link";

export function TechKartLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0057d9,#4aa3ff)] text-white shadow-[0_8px_20px_-12px_rgba(0,87,217,0.8)]">
        <span className="text-sm font-black tracking-tight">TK</span>
      </span>
      {!compact ? (
        <span className="text-xl font-semibold tracking-tight text-slate-900">
          TechKart
        </span>
      ) : null}
    </Link>
  );
}
