"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TimeSeriesPoint } from "@/lib/market-data";

type Period = "intraday" | "1w" | "1m";

const PERIOD_LABELS: Record<Period, string> = {
  intraday: "Intraday",
  "1w": "1W",
  "1m": "1M",
};

interface StockChartProps {
  symbol: string;
  changePositive?: boolean;
}

export function StockChart({ symbol, changePositive = true }: StockChartProps) {
  const [period, setPeriod] = useState<Period>("intraday");
  const [data, setData] = useState<TimeSeriesPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/stocks/${encodeURIComponent(symbol)}/history?period=${period}`
      );
      if (res.ok) {
        const json = await res.json();
        setData((json.data ?? []).reverse());
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [symbol, period]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const chartColor = changePositive ? "var(--green)" : "var(--red)";
  const chartColorHex = changePositive ? "#12392c" : "#a13d30";

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            className={`period-chip ${period === p ? "active" : ""}`}
            onClick={() => setPeriod(p)}
            data-testid={`period-${p}`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="mini-label">Caricamento grafico...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <p className="mini-label">Nessun dato disponibile</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColorHex} stopOpacity={0.24} />
                <stop offset="95%" stopColor={chartColorHex} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="datetime"
              tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickFormatter={(val: string) =>
                period === "intraday"
                  ? val.split(" ")[1]?.slice(0, 5) ?? val
                  : val.split(" ")[0]?.slice(5) ?? val
              }
              interval="preserveStartEnd"
              stroke="rgba(23,20,16,0.2)"
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              width={60}
              tickFormatter={(val: number) => val.toFixed(2)}
              stroke="rgba(23,20,16,0.2)"
            />
            <Tooltip
              formatter={(value) => [`$${Number(value).toFixed(2)}`, "Prezzo"]}
              labelFormatter={(label) => String(label)}
              contentStyle={{
                background: "rgba(255,251,245,0.95)",
                border: "1px solid var(--line)",
                borderRadius: "16px",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={chartColorHex}
              fill={`url(#gradient-${symbol})`}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
