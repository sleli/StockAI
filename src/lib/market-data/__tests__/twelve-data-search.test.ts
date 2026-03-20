import { describe, it, expect, vi, beforeEach } from "vitest";
import { TwelveDataProvider } from "../twelve-data";
import { MarketDataError } from "../types";

const VALID_SEARCH_RESPONSE = {
  data: [
    {
      symbol: "AAPL",
      instrument_name: "Apple Inc",
      exchange: "NASDAQ",
      instrument_type: "Common Stock",
      country: "United States",
    },
    {
      symbol: "AAPL",
      instrument_name: "Apple Inc",
      exchange: "LSE",
      instrument_type: "Common Stock",
      country: "United Kingdom",
    },
  ],
  status: "ok",
};

function mockFetchResponse(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  });
}

describe("TwelveDataProvider.searchSymbol", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TWELVE_DATA_API_KEY;
  });

  it("returns normalized SymbolSearchResult[] on successful search", async () => {
    const fetchMock = mockFetchResponse(VALID_SEARCH_RESPONSE);
    vi.stubGlobal("fetch", fetchMock);

    const provider = new TwelveDataProvider("test-api-key");
    const results = await provider.searchSymbol("AAPL");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(results).toHaveLength(2);

    expect(results[0].symbol).toBe("AAPL");
    expect(results[0].name).toBe("Apple Inc");
    expect(results[0].exchange).toBe("NASDAQ");
    expect(results[0].type).toBe("Common Stock");
    expect(results[0].country).toBe("United States");

    expect(results[1].symbol).toBe("AAPL");
    expect(results[1].name).toBe("Apple Inc");
    expect(results[1].exchange).toBe("LSE");
    expect(results[1].type).toBe("Common Stock");
    expect(results[1].country).toBe("United Kingdom");
  });

  it("returns an empty array when data is empty", async () => {
    const fetchMock = mockFetchResponse({ data: [], status: "ok" });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new TwelveDataProvider("test-api-key");
    const results = await provider.searchSymbol("XYZNOTFOUND");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(results).toEqual([]);
  });

  it("throws MarketDataError with code NETWORK_ERROR on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Connection refused"))
    );

    const provider = new TwelveDataProvider("test-api-key");

    await expect(provider.searchSymbol("AAPL")).rejects.toThrow(
      MarketDataError
    );

    try {
      await provider.searchSymbol("AAPL");
    } catch (error) {
      expect(error).toBeInstanceOf(MarketDataError);
      expect((error as MarketDataError).code).toBe("NETWORK_ERROR");
    }
  });

  it("throws MarketDataError with code RATE_LIMIT on 429 response", async () => {
    vi.stubGlobal("fetch", mockFetchResponse({}, 429));

    const provider = new TwelveDataProvider("test-api-key");

    await expect(provider.searchSymbol("AAPL")).rejects.toThrow(
      MarketDataError
    );

    try {
      await provider.searchSymbol("AAPL");
    } catch (error) {
      expect(error).toBeInstanceOf(MarketDataError);
      expect((error as MarketDataError).code).toBe("RATE_LIMIT");
      expect((error as MarketDataError).statusCode).toBe(429);
    }
  });

  it("throws MarketDataError with code PARSE_ERROR on malformed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
      })
    );

    const provider = new TwelveDataProvider("test-api-key");

    await expect(provider.searchSymbol("AAPL")).rejects.toThrow(
      MarketDataError
    );

    try {
      await provider.searchSymbol("AAPL");
    } catch (error) {
      expect(error).toBeInstanceOf(MarketDataError);
      expect((error as MarketDataError).code).toBe("PARSE_ERROR");
    }
  });
});
