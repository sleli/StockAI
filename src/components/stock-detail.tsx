"use client";

import { useState, useEffect } from "react";
import { StockChart } from "@/components/stock-chart";
import { StockNews } from "@/components/stock-news";
import type { NormalizedQuote } from "@/lib/market-data";

interface StockDetailProps {
  symbol: string;
}

export function StockDetail({ symbol }: StockDetailProps) {
  const [quote, setQuote] = useState<NormalizedQuote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/recent-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, name: symbol }),
    }).catch(() => {});
  }, [symbol]);

  useEffect(() => {
    async function fetchQuote() {
      try {
        const res = await fetch(
          `/api/quotes?symbol=${encodeURIComponent(symbol)}`
        );
        if (!res.ok) throw new Error("Errore nel caricamento");
        const data = await res.json();
        setQuote(data);
        if (data.name) {
          fetch("/api/recent-views", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbol, name: data.name }),
          }).catch(() => {});
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore");
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuote();
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="detail-card">
        <div className="flex items-center justify-center py-12">
          <p className="mini-label">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="detail-card">
        <div className="py-6">
          <p className="text-stock-down text-sm">
            {error ?? "Titolo non trovato"}
          </p>
        </div>
      </div>
    );
  }

  const changeColor =
    quote.change > 0
      ? "text-stock-up"
      : quote.change < 0
        ? "text-stock-down"
        : "";
  const changeSign = quote.change > 0 ? "+" : "";

  const stats = [
    { label: "Day high", value: quote.high !== null ? `$${quote.high.toFixed(2)}` : "—" },
    { label: "Day low", value: quote.low !== null ? `$${quote.low.toFixed(2)}` : "—" },
    { label: "Volume", value: quote.volume !== null ? quote.volume.toLocaleString() : "—" },
    { label: "Exchange", value: quote.exchange },
  ];

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Detail header */}
      <div className="detail-card rise">
        <div className="flex justify-between items-end gap-4">
          <div>
            <div className="mini-label">{symbol} / {quote.exchange}</div>
            <h2 className="font-serif text-xl mt-1">{quote.name}</h2>
            <div className="detail-price">${quote.price.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <span className={`font-mono text-xl font-semibold ${changeColor}`}>
              {changeSign}{quote.changePercent.toFixed(2)}%
            </span>
            <div className="mini-label mt-1">
              {changeSign}{quote.change.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="detail-grid">
          <div className="chart-shell">
            <div className="mini-label mb-2">Short history</div>
            <StockChart symbol={symbol} changePositive={quote.change >= 0} />
          </div>
          <div className="stats-panel">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-row">
                <span className="mini-label">{stat.label}</span>
                <strong className="font-mono text-sm">{stat.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* News */}
      <StockNews symbol={symbol} />
    </div>
  );
}
