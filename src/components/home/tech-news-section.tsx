import Link from "next/link";
import { getTechNews } from "@/lib/server/tech-news";

export async function TechNewsSection() {
  const news = await getTechNews();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Latest Tech News</h2>
        <span className="text-xs font-semibold text-slate-500">Live feed</span>
      </div>
      <div className="space-y-2">
        {news.map((item) => (
          <Link
            key={`${item.url}-${item.title}`}
            href={item.url}
            target="_blank"
            className="block rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
          >
            <p className="font-semibold text-slate-800">{item.title}</p>
            <p className="mt-1 text-xs text-slate-500">
              {item.source} • {new Date(item.publishedAt).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
