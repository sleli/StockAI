import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { MarketDataError } from "@/lib/market-data";

const mockGetTimeSeries = vi.fn();

vi.mock("@/lib/market-data", async () => {
  const actual = await vi.importActual("@/lib/market-data");
  return {
    ...actual,
    createMarketDataProvider: () => ({
      getTimeSeries: mockGetTimeSeries,
    }),
  };
});

import { GET } from "../route";

const MOCK_TIME_SERIES = [
  {
    datetime: "2024-01-15 10:00:00",
    open: 180.5,
    high: 182.0,
    low: 179.0,
    close: 181.5,
    volume: 1000000,
  },
];

describe("GET /api/stocks/[symbol]/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses default period (intraday) and calls getTimeSeries with 5min, 78", async () => {
    mockGetTimeSeries.mockResolvedValue(MOCK_TIME_SERIES);

    const request = new NextRequest("http://localhost/api/stocks/AAPL/history");
    const response = await GET(request, {
      params: Promise.resolve({ symbol: "AAPL" }),
    });

    expect(response.status).toBe(200);
    expect(mockGetTimeSeries).toHaveBeenCalledWith("AAPL", "5min", 78);

    const body = await response.json();
    expect(body.symbol).toBe("AAPL");
    expect(body.period).toBe("intraday");
    expect(body.data).toEqual(MOCK_TIME_SERIES);
  });

  it("handles period=1w and calls getTimeSeries with 1day, 5", async () => {
    mockGetTimeSeries.mockResolvedValue(MOCK_TIME_SERIES);

    const request = new NextRequest(
      "http://localhost/api/stocks/AAPL/history?period=1w"
    );
    const response = await GET(request, {
      params: Promise.resolve({ symbol: "AAPL" }),
    });

    expect(response.status).toBe(200);
    expect(mockGetTimeSeries).toHaveBeenCalledWith("AAPL", "1day", 5);

    const body = await response.json();
    expect(body.period).toBe("1w");
  });

  it("returns 400 for invalid period", async () => {
    const request = new NextRequest(
      "http://localhost/api/stocks/AAPL/history?period=invalid"
    );
    const response = await GET(request, {
      params: Promise.resolve({ symbol: "AAPL" }),
    });

    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain("Invalid period");
    expect(mockGetTimeSeries).not.toHaveBeenCalled();
  });

  it("returns 502 when provider throws MarketDataError", async () => {
    mockGetTimeSeries.mockRejectedValue(
      new MarketDataError("Twelve Data API returned status 500", "API_ERROR", 500)
    );

    const request = new NextRequest("http://localhost/api/stocks/AAPL/history");
    const response = await GET(request, {
      params: Promise.resolve({ symbol: "AAPL" }),
    });

    expect(response.status).toBe(502);

    const body = await response.json();
    expect(body.error).toContain("Twelve Data API returned status 500");
  });
});
