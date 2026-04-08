"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { PriceHistoryPoint } from "@/lib/price-history";
import { formatINR } from "@/lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

export function PriceHistoryChart({
  currentPrice,
  productId,
}: {
  currentPrice: number;
  productId: string;
}) {
  const [range, setRange] = useState<30 | 90>(30);
  const [points, setPoints] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadPriceHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/price-history/${encodeURIComponent(productId)}?range=${range}`,
        );

        if (!response.ok) {
          throw new Error("Unable to load price history");
        }

        const payload = (await response.json()) as {
          history?: PriceHistoryPoint[];
        };

        if (mounted) {
          setPoints(payload.history ?? []);
        }
      } catch (nextError) {
        if (mounted) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Unable to load price history",
          );
          setPoints([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadPriceHistory();

    return () => {
      mounted = false;
    };
  }, [currentPrice, productId, range]);

  const stats = useMemo(() => {
    if (points.length === 0) {
      return null;
    }
    const prices = points.map((point) => point.price);
    const low = Math.min(...prices);
    const high = Math.max(...prices);
    const avg = Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length);
    const first = prices[0] ?? currentPrice;
    const last = prices[prices.length - 1] ?? currentPrice;
    const changeValue = last - first;
    const changePercent = first > 0 ? (changeValue / first) * 100 : 0;

    return { low, high, avg, first, last, changeValue, changePercent };
  }, [currentPrice, points]);

  const data = useMemo(
    () => ({
      labels: points.map((point) => point.date.slice(5)),
      datasets: [
        {
          label: "Price",
          data: points.map((point) => point.price),
          borderColor: "#0057d9",
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 0,
          fill: true,
          backgroundColor: "rgba(74,163,255,0.12)",
        },
      ],
    }),
    [points],
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Price History</h3>
          <p className="text-xs text-slate-500">
            Free backend trend snapshots from live catalog price updates
          </p>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          {[30, 90].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option as 30 | 90)}
              className={`rounded-md px-3 py-1 transition ${
                range === option ? "bg-white text-blue-700 shadow" : "text-slate-600"
              }`}
            >
              {option}D
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-[180px] items-center justify-center text-sm text-slate-500">
          Loading price history...
        </div>
      ) : error ? (
        <div className="flex h-[180px] items-center justify-center text-sm text-rose-600">
          {error}
        </div>
      ) : !stats ? (
        <div className="flex h-[180px] items-center justify-center text-sm text-slate-500">
          Price stats not available yet.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Stat label="Current Price" value={formatINR(stats.last)} />
            <Stat label={`${range}D Average`} value={formatINR(stats.avg)} />
            <Stat label={`${range}D Low`} value={formatINR(stats.low)} />
            <Stat label={`${range}D High`} value={formatINR(stats.high)} />
          </div>

          <div
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              stats.changeValue <= 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {stats.changeValue <= 0 ? "Price dropped" : "Price increased"} by{" "}
            {formatINR(Math.abs(stats.changeValue))} (
            {Math.abs(stats.changePercent).toFixed(1)}%) in last {range} days
          </div>

          <div className="h-[90px] rounded-xl bg-slate-50 p-2">
            <Line
              data={data}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => ` ${formatINR(Number(ctx.raw))}`,
                    },
                  },
                },
                scales: {
                  x: { display: false },
                  y: { display: false },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}
