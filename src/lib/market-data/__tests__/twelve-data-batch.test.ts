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

describe("TwelveDataProvider.getQuotes()", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TWELVE_DATA_API_KEY;
  });

  it("returns normalized quotes for multiple symbols", async () => {
    const msftRaw = {
      ...VALID_RAW_QUOTE,
      symbol: "MSFT",
      name: "Microsoft Corporation",
      close: "390.00",
      change: "5.20",
      percent_change: "1.35",
      high: "392.00",
      low: "385.00",
      volume: "32100000",
    };

    const fetchMock = mockFetchResponse({
      AAPL: VALID_RAW_QUOTE,
      MSFT: msftRaw,
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new TwelveDataProvider("test-api-key");
    const quotes = await provider.getQuotes(["AAPL", "MSFT"]);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(Object.keys(quotes)).toHaveLength(2);

    expect(quotes.AAPL.symbol).toBe("AAPL");
    expect(quotes.AAPL.name).toBe("Apple Inc");
    expect(quotes.AAPL.price).toBe(182.52);
    expect(quotes.AAPL.change).toBe(3.14);
    expect(quotes.AAPL.changePercent).toBe(1.75);

    expect(quotes.MSFT.symbol).toBe("MSFT");
    expect(quotes.MSFT.name).toBe("Microsoft Corporation");
    expect(quotes.MSFT.price).toBe(390.0);
    expect(quotes.MSFT.change).toBe(5.2);
    expect(quotes.MSFT.changePercent).toBe(1.35);
  });

  it("returns normalized quote for a single symbol (direct response, not nested)", async () => {
    const fetchMock = mockFetchResponse(VALID_RAW_QUOTE);
    vi.stubGlobal("fetch", fetchMock);

    const provider = new TwelveDataProvider("test-api-key");
    const quotes = await provider.getQuotes(["AAPL"]);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(Object.keys(quotes)).toHaveLength(1);
    expect(quotes.AAPL.symbol).toBe("AAPL");
    expect(quotes.AAPL.price).toBe(182.52);
    expect(quotes.AAPL.volume).toBe(54321000);
    expect(quotes.AAPL.timestamp).toBe("2024-01-15T00:00:00.000Z");
  });

  it("returns empty object without calling fetch for empty array", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const provider = new TwelveDataProvider("test-api-key");
    const quotes = await provider.getQuotes([]);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(quotes).toEqual({});
  });

  it("throws MarketDataError with code NETWORK_ERROR on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Connection refused"))
    );

    const provider = new TwelveDataProvider("test-api-key");

    await expect(provider.getQuotes(["AAPL"])).rejects.toThrow(MarketDataError);

    try {
      await provider.getQuotes(["AAPL"]);
    } catch (error) {
      expect(error).toBeInstanceOf(MarketDataError);
      expect((error as MarketDataError).code).toBe("NETWORK_ERROR");
    }
  });

  it("throws MarketDataError with code RATE_LIMIT on 429 response", async () => {
    vi.stubGlobal("fetch", mockFetchResponse({}, 429));

    const provider = new TwelveDataProvider("test-api-key");

    await expect(provider.getQuotes(["AAPL"])).rejects.toThrow(MarketDataError);

    try {
      await provider.getQuotes(["AAPL"]);
    } catch (error) {
      expect(error).toBeInstanceOf(MarketDataError);
      expect((error as MarketDataError).code).toBe("RATE_LIMIT");
      expect((error as MarketDataError).statusCode).toBe(429);
    }
  });

  it("returns only valid quotes when some symbols have status error", async () => {
    const fetchMock = mockFetchResponse({
      AAPL: VALID_RAW_QUOTE,
      INVALID: { status: "error", message: "Symbol not found" },
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new TwelveDataProvider("test-api-key");
    const quotes = await provider.getQuotes(["AAPL", "INVALID"]);

    expect(Object.keys(quotes)).toHaveLength(1);
    expect(quotes.AAPL).toBeDefined();
    expect(quotes.AAPL.symbol).toBe("AAPL");
    expect(quotes.INVALID).toBeUndefined();
  });
});
