import { NextRequest, NextResponse } from "next/server";
import { createMarketDataProvider, MarketDataError } from "@/lib/market-data";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    );
  }

  try {
    const provider = createMarketDataProvider();
    const quote = await provider.getQuote(symbol);
    return NextResponse.json(quote);
  } catch (error) {
    if (error instanceof MarketDataError) {
      const status = error.code === "RATE_LIMIT" ? 429 : 502;
      return NextResponse.json(
        { error: error.message },
        { status }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch quote from provider" },
      { status: 502 }
    );
  }
}
