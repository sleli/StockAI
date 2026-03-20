import type { TwelveDataRawQuote, NormalizedQuote } from "./types";

function parseRequired(value: string): number {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseOptional(value: string): number | null {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toISO8601(datetime: string): string {
  // Date-only format like "2024-01-15"
  if (/^\d{4}-\d{2}-\d{2}$/.test(datetime)) {
    return `${datetime}T00:00:00.000Z`;
  }

  const date = new Date(datetime);
  if (Number.isNaN(date.getTime())) {
    // Fallback: return current time if unparseable
    return new Date().toISOString();
  }

  return date.toISOString();
}

export function normalizeQuote(raw: TwelveDataRawQuote): NormalizedQuote {
  return {
    symbol: raw.symbol,
    name: raw.name,
    exchange: raw.exchange,
    price: parseRequired(raw.close),
    change: parseRequired(raw.change),
    changePercent: parseRequired(raw.percent_change),
    high: parseOptional(raw.high),
    low: parseOptional(raw.low),
    volume: parseOptional(raw.volume),
    timestamp: toISO8601(raw.datetime),
  };
}
