import { NextRequest, NextResponse } from "next/server";
import { createMarketDataProvider, MarketDataError } from "@/lib/market-data";

const PERIOD_CONFIG: Record<string, { interval: string; outputsize: number }> = {
  intraday: { interval: "5min", outputsize: 78 },
  "1w": { interval: "1day", outputsize: 5 },
  "1m": { interval: "1day", outputsize: 22 },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const period = request.nextUrl.searchParams.get("period") ?? "intraday";

  const config = PERIOD_CONFIG[period];
  if (!config) {
    return NextResponse.json(
      { error: `Invalid period '${period}'. Valid: intraday, 1w, 1m` },
      { status: 400 }
    );
  }

  try {
    const provider = createMarketDataProvider();
    const data = await provider.getTimeSeries(
      symbol,
      config.interval,
      config.outputsize
    );

    return NextResponse.json({ symbol, period, data });
  } catch (error) {
    if (error instanceof MarketDataError) {
      const status = error.code === "RATE_LIMIT" ? 429 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json(
      { error: "Failed to fetch time series" },
      { status: 502 }
    );
  }
}
