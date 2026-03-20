import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { MarketDataError } from "@/lib/market-data/types";

const mockSearchSymbol = vi.fn();

vi.mock("@/lib/market-data", () => ({
  createMarketDataProvider: () => ({
    searchSymbol: mockSearchSymbol,
  }),
  MarketDataError,
}));

import { GET } from "../route";

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when q parameter is missing", async () => {
    const request = new NextRequest("http://localhost/api/search");
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Query parameter 'q' is required");
  });

  it("returns 200 with results for a valid query", async () => {
    const mockResults = [
      {
        symbol: "AAPL",
        name: "Apple Inc",
        exchange: "NASDAQ",
        type: "Common Stock",
        country: "United States",
      },
    ];
    mockSearchSymbol.mockResolvedValue(mockResults);

    const request = new NextRequest("http://localhost/api/search?q=AAPL");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.results).toEqual(mockResults);
  });

  it("returns 200 with empty results when no matches found", async () => {
    mockSearchSymbol.mockResolvedValue([]);

    const request = new NextRequest("http://localhost/api/search?q=XYZXYZ");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.results).toEqual([]);
  });

  it("returns 429 when provider throws MarketDataError with RATE_LIMIT", async () => {
    mockSearchSymbol.mockRejectedValue(
      new MarketDataError("Rate limit exceeded", "RATE_LIMIT", 429)
    );

    const request = new NextRequest("http://localhost/api/search?q=AAPL");
    const response = await GET(request);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 502 when provider throws MarketDataError with non-RATE_LIMIT code", async () => {
    mockSearchSymbol.mockRejectedValue(
      new MarketDataError("API unavailable", "API_ERROR", 503)
    );

    const request = new NextRequest("http://localhost/api/search?q=AAPL");
    const response = await GET(request);

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toBe("API unavailable");
  });

  it("returns 502 when provider throws a generic Error", async () => {
    mockSearchSymbol.mockRejectedValue(new Error("Something went wrong"));

    const request = new NextRequest("http://localhost/api/search?q=AAPL");
    const response = await GET(request);

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toBe("Failed to search symbols");
  });
});
