"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";

type Period = "1d" | "1w" | "1m";

const PERIOD_LABELS: Record<Period, string> = {
  "1d": "1D",
  "1w": "1W",
  "1m": "1M",
};

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed"];

interface ComparisonChartProps {
  symbols: string[];
  initialPeriod?: Period;
}

export function ComparisonChart({
  symbols,
  initialPeriod = "1d",
}: ComparisonChartProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComparison = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/stocks/compare?symbols=${symbols.join(",")}&period=${period}`
      );
      if (res.ok) {
        const json = await res.json();
        setData(json.data ?? []);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [symbols.join(","), period]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  return (
    <div>
      <div className="mb-4 flex gap-1">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {PERIOD_LABELS[p]}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-72 items-center justify-center">
          <p className="text-sm text-muted-foreground">Caricamento confronto...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-72 items-center justify-center">
          <p className="text-sm text-muted-foreground">Nessun dato disponibile</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={288}>
          <LineChart data={data}>
            <XAxis
              dataKey="datetime"
              tick={{ fontSize: 10 }}
              tickFormatter={(val: string) =>
                period === "1d"
                  ? val.split(" ")[1]?.slice(0, 5) ?? val
                  : val.split(" ")[0]?.slice(5) ?? val
              }
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              width={50}
              tickFormatter={(val: number) => `${val.toFixed(1)}%`}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(2)}%`]}
              labelFormatter={(label) => String(label)}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#999" strokeDasharray="3 3" />
            {symbols.map((symbol, i) => (
              <Line
                key={symbol}
                type="monotone"
                dataKey={symbol}
                stroke={COLORS[i % COLORS.length]}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
