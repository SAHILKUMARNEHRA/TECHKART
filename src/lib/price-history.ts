export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export function generatePriceHistory(currentPrice: number, days: 30 | 90): PriceHistoryPoint[] {
  const points: PriceHistoryPoint[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    points.push({
      date: d.toISOString().slice(0, 10),
      price: currentPrice,
    });
  }

  return points;
}
