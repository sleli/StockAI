import type { MarketDataProvider } from "./provider";
import type {
  NormalizedQuote,
  TwelveDataRawQuote,
  SymbolSearchResult,
  TwelveDataSearchResponse,
  TimeSeriesPoint,
  TwelveDataTimeSeriesResponse,
  NormalizedNewsItem,
  TwelveDataNewsResponse,
} from "./types";
import { MarketDataError } from "./types";
import { normalizeQuote } from "./quote-normalizer";

const TWELVE_DATA_BASE_URL = "https://api.twelvedata.com";

export class TwelveDataProvider implements MarketDataProvider {
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.TWELVE_DATA_API_KEY;
    if (!key) {
      throw new MarketDataError(
        "Twelve Data API key is required. Set TWELVE_DATA_API_KEY or pass it to the constructor.",
        "API_ERROR"
      );
    }
    this.apiKey = key;
  }

  async searchSymbol(query: string): Promise<SymbolSearchResult[]> {
    let response: Response;

    try {
      response = await fetch(
        `${TWELVE_DATA_BASE_URL}/symbol_search?symbol=${encodeURIComponent(query)}&outputsize=10&apikey=${this.apiKey}`
      );
    } catch (error) {
      throw new MarketDataError(
        `Network error searching for ${query}: ${error instanceof Error ? error.message : String(error)}`,
        "NETWORK_ERROR"
      );
    }

    if (response.status === 429) {
      throw new MarketDataError(
        "Twelve Data API rate limit exceeded",
        "RATE_LIMIT",
        429
      );
    }

    if (!response.ok) {
      throw new MarketDataError(
        `Twelve Data API returned status ${response.status}`,
        "API_ERROR",
        response.status
      );
    }

    let data: TwelveDataSearchResponse;

    try {
      data = await response.json();
    } catch (error) {
      throw new MarketDataError(
        `Failed to parse Twelve Data search response for ${query}`,
        "PARSE_ERROR"
      );
    }

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((item) => ({
      symbol: item.symbol,
      name: item.instrument_name,
      exchange: item.exchange,
      type: item.instrument_type,
      country: item.country,
    }));
  }

  async getTimeSeries(
    symbol: string,
    interval: string,
    outputsize: number
  ): Promise<TimeSeriesPoint[]> {
    let response: Response;

    try {
      response = await fetch(
        `${TWELVE_DATA_BASE_URL}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${this.apiKey}`
      );
    } catch (error) {
      throw new MarketDataError(
        `Network error fetching time series for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
        "NETWORK_ERROR"
      );
    }

    if (response.status === 429) {
      throw new MarketDataError(
        "Twelve Data API rate limit exceeded",
        "RATE_LIMIT",
        429
      );
    }

    if (!response.ok) {
      throw new MarketDataError(
        `Twelve Data API returned status ${response.status}`,
        "API_ERROR",
        response.status
      );
    }

    let data: TwelveDataTimeSeriesResponse;

    try {
      data = await response.json();
    } catch (error) {
      throw new MarketDataError(
        `Failed to parse Twelve Data time series response for ${symbol}`,
        "PARSE_ERROR"
      );
    }

    if (data.status === "error") {
      throw new MarketDataError(
        `Twelve Data API error: ${data.message ?? "Unknown error"}`,
        "API_ERROR"
      );
    }

    if (!data.values || !Array.isArray(data.values)) {
      return [];
    }

    return data.values.map((v) => ({
      datetime: v.datetime,
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseFloat(v.volume),
    }));
  }

  async getQuotes(symbols: string[]): Promise<Record<string, NormalizedQuote>> {
    if (symbols.length === 0) return {};

    const symbolsParam = symbols.join(",");
    let response: Response;

    try {
      response = await fetch(
        `${TWELVE_DATA_BASE_URL}/quote?symbol=${encodeURIComponent(symbolsParam)}&apikey=${this.apiKey}`
      );
    } catch (error) {
      throw new MarketDataError(
        `Network error fetching batch quotes: ${error instanceof Error ? error.message : String(error)}`,
        "NETWORK_ERROR"
      );
    }

    if (response.status === 429) {
      throw new MarketDataError(
        "Twelve Data API rate limit exceeded",
        "RATE_LIMIT",
        429
      );
    }

    if (!response.ok) {
      throw new MarketDataError(
        `Twelve Data API returned status ${response.status}`,
        "API_ERROR",
        response.status
      );
    }

    let data: Record<string, unknown>;

    try {
      data = await response.json();
    } catch (error) {
      throw new MarketDataError(
        "Failed to parse Twelve Data batch response",
        "PARSE_ERROR"
      );
    }

    const result: Record<string, NormalizedQuote> = {};

    if (symbols.length === 1) {
      // Single symbol: Twelve Data returns the quote directly, not nested
      if (data.status === "error") return result;
      try {
        result[symbols[0]] = normalizeQuote(data as TwelveDataRawQuote);
      } catch {
        // Skip symbols that fail to normalize
      }
    } else {
      // Multiple symbols: Twelve Data returns { AAPL: {...}, MSFT: {...} }
      for (const symbol of symbols) {
        const raw = data[symbol] as Record<string, unknown> | undefined;
        if (!raw || raw.status === "error") continue;
        try {
          result[symbol] = normalizeQuote(raw as TwelveDataRawQuote);
        } catch {
          // Skip symbols that fail to normalize
        }
      }
    }

    return result;
  }

  async getNews(symbol: string): Promise<NormalizedNewsItem[]> {
    let response: Response;

    try {
      response = await fetch(
        `${TWELVE_DATA_BASE_URL}/news?symbol=${encodeURIComponent(symbol)}&size=5&apikey=${this.apiKey}`
      );
    } catch (error) {
      throw new MarketDataError(
        `Network error fetching news for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
        "NETWORK_ERROR"
      );
    }

    if (response.status === 429) {
      throw new MarketDataError(
        "Twelve Data API rate limit exceeded",
        "RATE_LIMIT",
        429
      );
    }

    if (!response.ok) {
      throw new MarketDataError(
        `Twelve Data API returned status ${response.status}`,
        "API_ERROR",
        response.status
      );
    }

    let data: TwelveDataNewsResponse;

    try {
      data = await response.json();
    } catch {
      throw new MarketDataError(
        `Failed to parse Twelve Data news response for ${symbol}`,
        "PARSE_ERROR"
      );
    }

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.slice(0, 5).map((item) => ({
      title: item.title,
      source: item.source,
      publishedAt: item.datetime,
      url: item.url,
      snippet: item.description ?? "",
    }));
  }

  async getQuote(symbol: string): Promise<NormalizedQuote> {
    let response: Response;

    try {
      response = await fetch(
        `${TWELVE_DATA_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${this.apiKey}`
      );
    } catch (error) {
      throw new MarketDataError(
        `Network error fetching quote for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
        "NETWORK_ERROR"
      );
    }

    if (response.status === 429) {
      throw new MarketDataError(
        "Twelve Data API rate limit exceeded",
        "RATE_LIMIT",
        429
      );
    }

    if (!response.ok) {
      throw new MarketDataError(
        `Twelve Data API returned status ${response.status}`,
        "API_ERROR",
        response.status
      );
    }

    let data: Record<string, unknown>;

    try {
      data = await response.json();
    } catch (error) {
      throw new MarketDataError(
        `Failed to parse Twelve Data response for ${symbol}`,
        "PARSE_ERROR"
      );
    }

    if (data.status === "error") {
      throw new MarketDataError(
        `Twelve Data API error: ${data.message ?? "Unknown error"}`,
        "API_ERROR"
      );
    }

    try {
      return normalizeQuote(data as TwelveDataRawQuote);
    } catch (error) {
      throw new MarketDataError(
        `Failed to normalize quote for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
        "PARSE_ERROR"
      );
    }
  }
}
