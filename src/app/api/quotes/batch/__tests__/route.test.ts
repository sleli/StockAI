import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { MarketDataError } from "@/lib/market-data/types";

const mockGetQuotes = vi.fn();

vi.mock("@/lib/market-data", () => ({
  createMarketDataProvider: () => ({
    getQuotes: mockGetQuotes,
  }),
  MarketDataError,
}));

import { GET } from "../route";

describe("GET /api/quotes/batch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when symbols parameter is missing", async () => {
    const request = new NextRequest("http://localhost/api/quotes/batch");
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Query parameter 'symbols' is required");
  });

  it("returns 200 with quotes for valid symbols", async () => {
    const mockQuotes = {
      AAPL: {
        symbol: "AAPL",
        name: "Apple Inc",
        price: 182.52,
        change: 3.14,
        changePercent: 1.75,
        high: 184.0,
        low: 179.5,
        volume: 54321000,
        timestamp: "2024-01-15T00:00:00.000Z",
      },
      MSFT: {
        symbol: "MSFT",
        name: "Microsoft Corporation",
        price: 390.0,
        change: 5.2,
        changePercent: 1.35,
        high: 392.0,
        low: 385.0,
        volume: 32100000,
        timestamp: "2024-01-15T00:00:00.000Z",
      },
    };
    mockGetQuotes.mockResolvedValue(mockQuotes);

    const request = new NextRequest(
      "http://localhost/api/quotes/batch?symbols=AAPL,MSFT"
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.quotes).toEqual(mockQuotes);
  });

  it("returns 429 when provider throws MarketDataError with RATE_LIMIT", async () => {
    mockGetQuotes.mockRejectedValue(
      new MarketDataError("Rate limit exceeded", "RATE_LIMIT", 429)
    );

    const request = new NextRequest(
      "http://localhost/api/quotes/batch?symbols=AAPL"
    );
    const response = await GET(request);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 502 when provider throws MarketDataError with non-RATE_LIMIT code", async () => {
    mockGetQuotes.mockRejectedValue(
      new MarketDataError("API unavailable", "API_ERROR", 503)
    );

    const request = new NextRequest(
      "http://localhost/api/quotes/batch?symbols=AAPL"
    );
    const response = await GET(request);

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toBe("API unavailable");
  });

  it("returns 400 when more than 20 symbols are provided", async () => {
    const symbols = Array.from({ length: 21 }, (_, i) => `SYM${i}`).join(",");
    const request = new NextRequest(
      `http://localhost/api/quotes/batch?symbols=${symbols}`
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Maximum 20 symbols allowed");
  });
});
