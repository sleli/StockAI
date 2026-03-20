import { NextRequest, NextResponse } from "next/server";
import { createMarketDataProvider, MarketDataError } from "@/lib/market-data";

const PERIOD_CONFIG: Record<string, { interval: string; outputsize: number }> = {
  "1d": { interval: "5min", outputsize: 78 },
  "1w": { interval: "1day", outputsize: 5 },
  "1m": { interval: "1day", outputsize: 22 },
};

export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get("symbols");
  const period = request.nextUrl.searchParams.get("period") ?? "1d";

  if (!symbolsParam || !symbolsParam.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'symbols' is required" },
      { status: 400 }
    );
  }

  const symbols = symbolsParam.split(",").map((s) => s.trim()).filter(Boolean);

  if (symbols.length < 2) {
    return NextResponse.json(
      { error: "At least 2 symbols are required" },
      { status: 400 }
    );
  }

  if (symbols.length > 5) {
    return NextResponse.json(
      { error: "Maximum 5 symbols allowed" },
      { status: 400 }
    );
  }

  const config = PERIOD_CONFIG[period];
  if (!config) {
    return NextResponse.json(
      { error: `Invalid period '${period}'. Valid: 1d, 1w, 1m` },
      { status: 400 }
    );
  }

  try {
    const provider = createMarketDataProvider();

    const seriesResults = await Promise.all(
      symbols.map((symbol) =>
        provider.getTimeSeries(symbol, config.interval, config.outputsize)
      )
    );

    // Normalize each series to percentage change from first point
    const normalizedSeries = symbols.map((symbol, i) => {
      const series = seriesResults[i];
      if (series.length === 0) return [];

      const firstClose = series[series.length - 1].close; // Last item is oldest after reverse
      // Actually Twelve Data returns newest first, so the last element is oldest
      const oldest = series[series.length - 1];
      const basePrice = oldest.close;

      return series.map((point) => ({
        datetime: point.datetime,
        value: Math.round(((point.close - basePrice) / basePrice) * 10000) / 100,
      }));
    });

    // Merge all series by datetime
    // Use the first symbol's datetimes as reference, reversed (oldest first)
    const refSeries = normalizedSeries[0]?.slice().reverse() ?? [];
    const data = refSeries.map((point, idx) => {
      const entry: Record<string, unknown> = { datetime: point.datetime };
      symbols.forEach((symbol, i) => {
        const reversed = normalizedSeries[i]?.slice().reverse() ?? [];
        entry[symbol] = reversed[idx]?.value ?? null;
      });
      return entry;
    });

    return NextResponse.json({ symbols, period, data });
  } catch (error) {
    if (error instanceof MarketDataError) {
      const status = error.code === "RATE_LIMIT" ? 429 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json(
      { error: "Failed to fetch comparison data" },
      { status: 502 }
    );
  }
}
