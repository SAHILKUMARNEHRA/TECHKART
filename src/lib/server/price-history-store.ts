import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { generatePriceHistory, PriceHistoryPoint } from "@/lib/price-history";

interface PriceHistoryDb {
  [productId: string]: PriceHistoryPoint[];
}

const DB_PATH = path.join(process.cwd(), "data", "price-history.json");

async function readDb(): Promise<PriceHistoryDb> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw) as PriceHistoryDb;
  } catch {
    return {};
  }
}

async function writeDb(db: PriceHistoryDb) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function dedupeAndSort(points: PriceHistoryPoint[]) {
  const map = new Map<string, number>();
  points.forEach((point) => map.set(point.date, point.price));
  return Array.from(map.entries())
    .map(([date, price]) => ({ date, price }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getOrCreatePriceHistory(
  productId: string,
  currentPrice: number,
  days: 30 | 90,
): Promise<PriceHistoryPoint[]> {
  const db = await readDb();
  const today = todayDate();

  if (!db[productId] || db[productId].length === 0) {
    db[productId] = generatePriceHistory(currentPrice, 90);
  }

  const hasToday = db[productId].some((point) => point.date === today);
  if (!hasToday) {
    db[productId].push({ date: today, price: currentPrice });
  }

  db[productId] = dedupeAndSort(db[productId]).slice(-90);

  try {
    await writeDb(db);
  } catch {
    // Ignore write failures in restricted deployment environments.
  }

  return db[productId].slice(-days);
}
