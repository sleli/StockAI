import { NextRequest, NextResponse } from "next/server";
import { getQuotesFromCache } from "@/lib/market-data/quote-cache";

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

  const quotes = await getQuotesFromCache(symbols);

  return NextResponse.json({ quotes, source: "cache" });
}
