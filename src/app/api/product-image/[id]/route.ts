import { NextResponse } from "next/server";
import { fallbackProducts } from "@/lib/fallback-data";

const categoryStyles: Record<string, { start: string; end: string; accent: string }> = {
  Mobiles: { start: "#0f172a", end: "#1d4ed8", accent: "#38bdf8" },
  Laptops: { start: "#14532d", end: "#0f766e", accent: "#a3e635" },
  Tablets: { start: "#4c1d95", end: "#2563eb", accent: "#c084fc" },
  Smartwatches: { start: "#7c2d12", end: "#dc2626", accent: "#fdba74" },
  Earbuds: { start: "#1f2937", end: "#111827", accent: "#f59e0b" },
};

function escapeXml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = fallbackProducts.find((item) => item.id === id);

  if (!product) {
    return new NextResponse("Not found", { status: 404 });
  }

  const palette = categoryStyles[product.category] ?? categoryStyles.Mobiles;
  const specLine = escapeXml(product.shortSpecs.slice(0, 3).join(" • "));
  const title = escapeXml(product.name);
  const brand = escapeXml(product.brand);
  const year = product.releaseYear ? String(product.releaseYear) : "Latest";

  const svg = `
    <svg width="1200" height="900" viewBox="0 0 1200 900" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="900" gradientUnits="userSpaceOnUse">
          <stop stop-color="${palette.start}" />
          <stop offset="1" stop-color="${palette.end}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" rx="48" fill="url(#bg)" />
      <circle cx="970" cy="180" r="150" fill="${palette.accent}" fill-opacity="0.18" />
      <circle cx="1030" cy="740" r="220" fill="${palette.accent}" fill-opacity="0.12" />
      <rect x="84" y="88" width="190" height="52" rx="26" fill="white" fill-opacity="0.12" />
      <text x="126" y="122" fill="white" font-size="28" font-family="Arial, sans-serif" font-weight="700">${escapeXml(product.category)}</text>
      <text x="84" y="280" fill="white" font-size="72" font-family="Arial, sans-serif" font-weight="700">${title}</text>
      <text x="84" y="350" fill="white" fill-opacity="0.82" font-size="34" font-family="Arial, sans-serif">${brand} • ${year}</text>
      <text x="84" y="428" fill="white" fill-opacity="0.92" font-size="30" font-family="Arial, sans-serif">${specLine}</text>
      <rect x="84" y="560" width="460" height="180" rx="36" fill="white" fill-opacity="0.1" />
      <text x="124" y="635" fill="white" font-size="30" font-family="Arial, sans-serif" font-weight="700">TechKart Curated Pick</text>
      <text x="124" y="690" fill="white" fill-opacity="0.78" font-size="26" font-family="Arial, sans-serif">Recent model from the last two years</text>
      <text x="124" y="730" fill="white" fill-opacity="0.78" font-size="26" font-family="Arial, sans-serif">Image card generated from product metadata</text>
    </svg>
  `.trim();

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
