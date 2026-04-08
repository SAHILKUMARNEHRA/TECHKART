import { cache } from "react";

const NEWS_FETCH_TIMEOUT_MS = 5000;

export interface TechNewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

export const getTechNews = cache(async (): Promise<TechNewsItem[]> => {
  const key = process.env.NEWS_API_KEY;

  if (!key) {
    return [
      {
        title: "Add NEWS_API_KEY to load live tech headlines",
        url: "https://newsapi.org/",
        source: "Setup",
        publishedAt: new Date().toISOString(),
      },
    ];
  }

  try {
    const url = new URL("https://newsapi.org/v2/top-headlines");
    url.searchParams.set("category", "technology");
    url.searchParams.set("language", "en");
    url.searchParams.set("pageSize", "6");
    url.searchParams.set("apiKey", key);

    const response = await fetch(url, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(NEWS_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error("Failed news fetch");
    }

    const payload = (await response.json()) as {
      articles?: Array<{
        title?: string;
        url?: string;
        source?: { name?: string };
        publishedAt?: string;
      }>;
    };

    return (payload.articles ?? [])
      .filter((item) => item.title && item.url)
      .map((item) => ({
        title: item.title ?? "Untitled",
        url: item.url ?? "#",
        source: item.source?.name ?? "Unknown",
        publishedAt: item.publishedAt ?? new Date().toISOString(),
      }))
      .slice(0, 6);
  } catch {
    return [
      {
        title: "Tech news unavailable right now",
        url: "#",
        source: "System",
        publishedAt: new Date().toISOString(),
      },
    ];
  }
});
