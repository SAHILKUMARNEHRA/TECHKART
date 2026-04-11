export interface TechNews {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  source: string;
}

const FALLBACK_NEWS: TechNews[] = [
  {
    id: "fallback-1",
    title: "Tech news unavailable right now",
    description: "Stay updated with the latest in technology.",
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=400",
    publishedAt: new Date().toISOString(),
    source: "System",
  },
];

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
let newsCache: { data: TechNews[]; timestamp: number } | null = null;

export async function getTechNews(): Promise<TechNews[]> {
  if (newsCache && Date.now() - newsCache.timestamp < CACHE_TTL) {
    return newsCache.data;
  }

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return FALLBACK_NEWS;

  try {
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=10&apiKey=${apiKey}`,
      { next: { revalidate: 1800 } },
    );

    if (!response.ok) throw new Error("News fetch failed");

    const data = await response.json();
    const news = (data.articles || []).map((article: any, index: number) => ({
      id: `news-${index}`,
      title: article.title,
      description: article.description || "Stay updated with the latest in technology.",
      url: article.url,
      imageUrl: article.urlToImage || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=400",
      publishedAt: article.publishedAt,
      source: article.source?.name || "Tech News",
    }));

    newsCache = { data: news, timestamp: Date.now() };
    return news;
  } catch (error) {
    console.error("News fetch error:", error);
    return FALLBACK_NEWS;
  }
}
