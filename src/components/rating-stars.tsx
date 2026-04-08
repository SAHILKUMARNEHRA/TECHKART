import { Star } from "lucide-react";
import { toStars } from "@/lib/utils";

export function RatingStars({ rating }: { rating: number }) {
  const { full, empty } = toStars(rating);

  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: full }).map((_, idx) => (
        <Star key={`full-${idx}`} size={14} fill="currentColor" strokeWidth={1.8} />
      ))}
      {Array.from({ length: empty }).map((_, idx) => (
        <Star key={`empty-${idx}`} size={14} strokeWidth={1.8} className="text-slate-300" />
      ))}
    </span>
  );
}
