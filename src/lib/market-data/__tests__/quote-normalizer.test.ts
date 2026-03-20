import { describe, it, expect } from "vitest";
import { normalizeQuote } from "../quote-normalizer";
import type { TwelveDataRawQuote } from "../types";

describe("normalizeQuote", () => {
  it("correctly normalizes a complete TwelveDataRawQuote", () => {
    const raw: TwelveDataRawQuote = {
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

    const result = normalizeQuote(raw);

    expect(result.symbol).toBe("AAPL");
    expect(result.name).toBe("Apple Inc");
    expect(result.exchange).toBe("NASDAQ");
    expect(result.price).toBe(182.52);
    expect(result.change).toBe(3.14);
    expect(result.changePercent).toBe(1.75);
    expect(result.high).toBe(184.0);
    expect(result.low).toBe(179.5);
    expect(result.volume).toBe(54321000);
    expect(result.timestamp).toBe("2024-01-15T00:00:00.000Z");
  });

  it("returns null for missing/empty optional fields (high, low, volume)", () => {
    const raw: TwelveDataRawQuote = {
      symbol: "TSLA",
      name: "Tesla Inc",
      exchange: "NASDAQ",
      close: "250.00",
      change: "-2.00",
      percent_change: "-0.79",
      high: "",
      low: "",
      volume: "",
      datetime: "2024-01-15",
    };

    const result = normalizeQuote(raw);

    expect(result.price).toBe(250.0);
    expect(result.change).toBe(-2.0);
    expect(result.changePercent).toBe(-0.79);
    expect(result.high).toBeNull();
    expect(result.low).toBeNull();
    expect(result.volume).toBeNull();
  });

  it("handles malformed numeric values: required → 0, optional → null", () => {
    const raw: TwelveDataRawQuote = {
      symbol: "BAD",
      name: "Bad Data Corp",
      exchange: "NYSE",
      close: "not-a-number",
      change: "abc",
      percent_change: "xyz",
      high: "nope",
      low: "nah",
      volume: "---",
      datetime: "2024-01-15",
    };

    const result = normalizeQuote(raw);

    expect(result.price).toBe(0);
    expect(result.change).toBe(0);
    expect(result.changePercent).toBe(0);
    expect(result.high).toBeNull();
    expect(result.low).toBeNull();
    expect(result.volume).toBeNull();
  });

  it("converts date-only datetime to ISO 8601 ending in T00:00:00.000Z", () => {
    const raw: TwelveDataRawQuote = {
      symbol: "MSFT",
      name: "Microsoft",
      exchange: "NASDAQ",
      close: "400.00",
      change: "1.00",
      percent_change: "0.25",
      high: "401.00",
      low: "399.00",
      volume: "10000",
      datetime: "2024-01-15",
    };

    const result = normalizeQuote(raw);

    expect(result.timestamp).toBe("2024-01-15T00:00:00.000Z");
  });

  it("converts full datetime to a valid ISO 8601 string", () => {
    const raw: TwelveDataRawQuote = {
      symbol: "GOOG",
      name: "Alphabet",
      exchange: "NASDAQ",
      close: "140.00",
      change: "0.50",
      percent_change: "0.36",
      high: "141.00",
      low: "139.00",
      volume: "20000",
      datetime: "2024-01-15 14:30:00",
    };

    const result = normalizeQuote(raw);

    // Should produce a valid ISO string
    const parsed = new Date(result.timestamp);
    expect(parsed.getTime()).not.toBeNaN();
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
