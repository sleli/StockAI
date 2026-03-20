import { prisma } from "@/lib/prisma";
import type { NormalizedQuote } from "./types";

export async function saveQuotesToCache(
  quotes: Record<string, NormalizedQuote>
): Promise<void> {
  const entries = Object.entries(quotes);
  if (entries.length === 0) return;

  await Promise.all(
    entries.map(async ([ticker, quote]) => {
      try {
        const symbol = await prisma.symbol.findUnique({
          where: { ticker },
        });
        if (!symbol) return;

        await prisma.quoteCache.upsert({
          where: { symbolId: symbol.id },
          update: {
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            high: quote.high,
            low: quote.low,
            volume: quote.volume,
            timestamp: new Date(quote.timestamp),
          },
          create: {
            symbolId: symbol.id,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            high: quote.high,
            low: quote.low,
            volume: quote.volume,
            timestamp: new Date(quote.timestamp),
          },
        });
      } catch {
        // Log but don't block
      }
    })
  );
}

export interface CachedQuote {
  ticker: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  high: number | null;
  low: number | null;
  volume: number | null;
  cachedAt: string;
}

export async function getQuotesFromCache(
  tickers: string[]
): Promise<CachedQuote[]> {
  if (tickers.length === 0) return [];

  const cachedQuotes = await prisma.quoteCache.findMany({
    where: {
      symbol: { ticker: { in: tickers } },
    },
    include: { symbol: true },
  });

  return cachedQuotes.map((cq) => ({
    ticker: cq.symbol.ticker,
    name: cq.symbol.name,
    exchange: cq.symbol.exchange,
    price: cq.price,
    change: cq.change,
    changePercent: cq.changePercent,
    high: cq.high,
    low: cq.low,
    volume: cq.volume,
    cachedAt: cq.updatedAt.toISOString(),
  }));
}
