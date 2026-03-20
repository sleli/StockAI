import { NextRequest, NextResponse } from "next/server";
import { createMarketDataProvider, MarketDataError } from "@/lib/market-data";
import { RateLimiter } from "@/lib/rate-limiter";
import {
  saveQuotesToCache,
  getQuotesFromCache,
} from "@/lib/market-data/quote-cache";

const rateLimiter = new RateLimiter(8, 60000);
const PROVIDER_TIMEOUT_MS = 3000;

export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get("symbols");

  if (!symbolsParam || !symbolsParam.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'symbols' is required" },
      { status: 400 }
    );
  }

  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json(
      { error: "At least one symbol is required" },
      { status: 400 }
    );
  }

  if (symbols.length > 20) {
    return NextResponse.json(
      { error: "Maximum 20 symbols allowed" },
      { status: 400 }
    );
  }

  if (!rateLimiter.tryConsume()) {
    const retryAfter = rateLimiter.getRetryAfterSeconds();
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  try {
    const provider = createMarketDataProvider();

    // Race provider against timeout
    const quotes = await Promise.race([
      provider.getQuotes(symbols),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("PROVIDER_TIMEOUT")), PROVIDER_TIMEOUT_MS)
      ),
    ]);

    // Save to cache (fire-and-forget)
    saveQuotesToCache(quotes).catch(() => {});

    return NextResponse.json({ quotes, source: "provider" });
  } catch (error) {
    // On timeout or error, try cache fallback
    if (
      error instanceof Error &&
      error.message === "PROVIDER_TIMEOUT"
    ) {
      try {
        const cached = await getQuotesFromCache(symbols);
        if (cached.length > 0) {
          const quotesMap: Record<string, unknown> = {};
          for (const cq of cached) {
            quotesMap[cq.ticker] = {
              symbol: cq.ticker,
              name: cq.name,
              exchange: cq.exchange,
              price: cq.price,
              change: cq.change,
              changePercent: cq.changePercent,
              high: cq.high,
              low: cq.low,
              volume: cq.volume,
              timestamp: cq.cachedAt,
            };
          }
          return NextResponse.json({
            quotes: quotesMap,
            source: "cache",
            cachedAt: cached[0]?.cachedAt,
          });
        }
      } catch {
        // Cache read failed too
      }

      return NextResponse.json(
        { error: "Provider timeout, no cached data" },
        { status: 504 }
      );
    }

    if (error instanceof MarketDataError) {
      const status = error.code === "RATE_LIMIT" ? 429 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 502 }
    );
  }
}
