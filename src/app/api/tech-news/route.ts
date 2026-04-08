import { NextResponse } from "next/server";
import { getTechNews } from "@/lib/server/tech-news";

export async function GET() {
  const news = await getTechNews();
  return NextResponse.json({ ok: true, count: news.length, news });
}
