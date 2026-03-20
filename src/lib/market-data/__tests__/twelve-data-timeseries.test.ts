import { describe, it, expect, vi, beforeEach } from "vitest";
import { TwelveDataProvider } from "../twelve-data";
import { MarketDataError } from "../types";

function mockFetchResponse(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  });
}

describe("TwelveDataProvider.getTimeSeries", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TWELVE_DATA_API_KEY;
  });

  it("returns parsed TimeSeriesPoint array on success", async () => {
    const fetchMock = mockFetchResponse({
      values: [
        {
          datetime: "2024-01-15 10:00:00",
          open: "180.5",
          high: "182.0",
          low: "179.0",
          close: "181.5",
          volume: "1000000",
        },
      ],
      status: "ok",
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new TwelveDataProvider("test-api-key");
    const result = await provider.getTimeSeries("AAPL", "5min", 78);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result).toHaveLength(1);
    expect(result[0].datetime).toBe("2024-01-15 10:00:00");
    expect(result[0].open).toBe(180.5);
    expect(result[0].high).toBe(182.0);
    expect(result[0].low).toBe(179.0);
    expect(result[0].close).toBe(181.5);
    expect(result[0].volume).toBe(1000000);
  });

  it("returns empty array when values is empty", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchResponse({ values: [], status: "ok" })
    );

    const provider = new TwelveDataProvider("test-api-key");
    const result = await provider.getTimeSeries("AAPL", "5min", 78);

    expect(result).toEqual([]);
  });

  it("throws MarketDataError with code NETWORK_ERROR on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Connection refused"))
    );

    const provider = new TwelveDataProvider("test-api-key");

    await expect(provider.getTimeSeries("AAPL", "5min", 78)).rejects.toThrow(
      MarketDataError
    );

    try {
      await provider.getTimeSeries("AAPL", "5min", 78);
    } catch (error) {
      expect(error).toBeInstanceOf(MarketDataError);
      expect((error as MarketDataError).code).toBe("NETWORK_ERROR");
    }
  });

  it("throws MarketDataError with code RATE_LIMIT on 429 response", async () => {
    vi.stubGlobal("fetch", mockFetchResponse({}, 429));

    const provider = new TwelveDataProvider("test-api-key");

    await expect(provider.getTimeSeries("AAPL", "5min", 78)).rejects.toThrow(
      MarketDataError
    );

    try {
      await provider.getTimeSeries("AAPL", "5min", 78);
    } catch (error) {
      expect(error).toBeInstanceOf(MarketDataError);
      expect((error as MarketDataError).code).toBe("RATE_LIMIT");
      expect((error as MarketDataError).statusCode).toBe(429);
    }
  });

  it("throws MarketDataError with code API_ERROR when body contains status error", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchResponse({ status: "error", message: "Invalid symbol" })
    );

    const provider = new TwelveDataProvider("test-api-key");

    await expect(provider.getTimeSeries("INVALID", "5min", 78)).rejects.toThrow(
      MarketDataError
    );

    try {
      await provider.getTimeSeries("INVALID", "5min", 78);
    } catch (error) {
      expect(error).toBeInstanceOf(MarketDataError);
      expect((error as MarketDataError).code).toBe("API_ERROR");
      expect((error as MarketDataError).message).toContain("Invalid symbol");
    }
  });
});
