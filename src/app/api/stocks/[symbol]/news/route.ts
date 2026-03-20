import { NextRequest, NextResponse } from "next/server";
import { createMarketDataProvider, MarketDataError } from "@/lib/market-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;

  try {
    const provider = createMarketDataProvider();
    const news = await provider.getNews(symbol);
    return NextResponse.json({ symbol, news });
  } catch (error) {
    if (error instanceof MarketDataError) {
      const status = error.code === "RATE_LIMIT" ? 429 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 502 }
    );
  }
}
