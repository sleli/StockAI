import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { MarketDataError } from "@/lib/market-data/types";
import type { NormalizedQuote } from "@/lib/market-data/types";

const mockGetQuote = vi.fn();

vi.mock("@/lib/market-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/market-data")>();
  return {
    ...actual,
    createMarketDataProvider: vi.fn(() => ({
      getQuote: mockGetQuote,
    })),
  };
});

import { GET } from "../route";

const MOCK_QUOTE: NormalizedQuote = {
  symbol: "AAPL",
  name: "Apple Inc",
  exchange: "NASDAQ",
  price: 182.52,
  change: 3.14,
  changePercent: 1.75,
  high: 184.0,
  low: 179.5,
  volume: 54321000,
  timestamp: "2024-01-15T00:00:00.000Z",
};

describe("GET /api/quotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when symbol parameter is missing", async () => {
    const request = new NextRequest("http://localhost/api/quotes");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Symbol parameter is required" });
  });

  it("returns 200 with quote data for a valid symbol", async () => {
    mockGetQuote.mockResolvedValue(MOCK_QUOTE);

    const request = new NextRequest("http://localhost/api/quotes?symbol=AAPL");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(MOCK_QUOTE);
    expect(mockGetQuote).toHaveBeenCalledWith("AAPL");
  });

  it("returns 502 when provider throws MarketDataError with NETWORK_ERROR", async () => {
    mockGetQuote.mockRejectedValue(
      new MarketDataError("Network failure", "NETWORK_ERROR")
    );

    const request = new NextRequest("http://localhost/api/quotes?symbol=AAPL");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data).toEqual({ error: "Network failure" });
  });

  it("returns 429 when provider throws MarketDataError with RATE_LIMIT", async () => {
    mockGetQuote.mockRejectedValue(
      new MarketDataError("Rate limit exceeded", "RATE_LIMIT", 429)
    );

    const request = new NextRequest("http://localhost/api/quotes?symbol=AAPL");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data).toEqual({ error: "Rate limit exceeded" });
  });

  it("returns 502 with generic message when provider throws unknown error", async () => {
    mockGetQuote.mockRejectedValue(new Error("Something unexpected"));

    const request = new NextRequest("http://localhost/api/quotes?symbol=AAPL");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data).toEqual({ error: "Failed to fetch quote from provider" });
  });
});
