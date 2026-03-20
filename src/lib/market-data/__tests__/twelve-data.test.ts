import { describe, it, expect, vi, beforeEach } from "vitest";
import { TwelveDataProvider } from "../twelve-data";
import { MarketDataError } from "../types";

const VALID_RAW_QUOTE = {
  symbol: "AAPL",
  name: "Apple Inc",
  exchange: "NASDAQ",
  close: "182.52",
  change: "3.14",
  percent_change: "1.75",
  high: "184.00",
  low: "179.50",
  volume: "54321000",
  datetime: "2024-01-15",
};

function mockFetchResponse(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  });
}

describe("TwelveDataProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TWELVE_DATA_API_KEY;
  });

  it("returns a NormalizedQuote on successful fetch", async () => {
    const fetchMock = mockFetchResponse(VALID_RAW_QUOTE);
    vi.stubGlobal("fetch", fetchMock);

    const provider = new TwelveDataProvider("test-api-key");
    const quote = await provider.getQuote("AAPL");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(quote.symbol).toBe("AAPL");
    expect(quote.name).toBe("Apple Inc");
    expect(quote.price).toBe(182.52);
    expect(quote.change).toBe(3.14);
    expect(quote.changePercent).toBe(1.75);
    expect(quote.high).toBe(184.0);
    expect(quote.low).toBe(179.5);
    expect(quote.volume).toBe(54321000);
    expect(quote.timestamp).toBe("2024-01-15T00:00:00.000Z");
  });

  it("throws MarketDataError with code API_ERROR when API key is missing", () => {
    expect(() => new TwelveDataProvider("")).toThrow(MarketDataError);

    try {
      new TwelveDataProvider("");
    } catch (error) {
      expect(error).toBeInstanceOf(MarketDataError);
      expect((error as MarketDataError).code).toBe("API_ERROR");
    }
  });

  it("throws MarketDataError with code NETWORK_ERROR on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Connection refused"))
    );

    const provider = new TwelveDataProvider("test-api-key");

    await expect(provider.getQuote("AAPL")).rejects.toThrow(MarketDataError);

    try {
      await provider.getQuote("AAPL");
    } catch (error) {
      expect(error).toBeInstanceOf(MarketDataError);
      expect((error as MarketDataError).code).toBe("NETWORK_ERROR");
    }
  });

  it("throws MarketDataError with code RATE_LIMIT on 429 response", async () => {
    vi.stubGlobal("fetch", mockFetchResponse({}, 429));

    const provider = new TwelveDataProvider("test-api-key");

    await expect(provider.getQuote("AAPL")).rejects.toThrow(MarketDataError);

    try {
      await provider.getQuote("AAPL");
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

    await expect(provider.getQuote("INVALID")).rejects.toThrow(MarketDataError);

    try {
      await provider.getQuote("INVALID");
    } catch (error) {
      expect(error).toBeInstanceOf(MarketDataError);
      expect((error as MarketDataError).code).toBe("API_ERROR");
      expect((error as MarketDataError).message).toContain("Invalid symbol");
    }
  });
});
