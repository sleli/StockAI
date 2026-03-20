import { NextRequest, NextResponse } from "next/server";
import { createMarketDataProvider, MarketDataError } from "@/lib/market-data";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q || !q.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  try {
    const provider = createMarketDataProvider();
    const results = await provider.searchSymbol(q);
    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof MarketDataError) {
      const status = error.code === "RATE_LIMIT" ? 429 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json(
      { error: "Failed to search symbols" },
      { status: 502 }
    );
  }
}
