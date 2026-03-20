export interface NormalizedQuote {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  high: number | null;
  low: number | null;
  volume: number | null;
  timestamp: string; // ISO 8601
}

export interface TwelveDataRawQuote {
  symbol: string;
  name: string;
  exchange: string;
  close: string;
  change: string;
  percent_change: string;
  high: string;
  low: string;
  volume: string;
  datetime: string;
  [key: string]: unknown;
}

export interface SymbolSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  country: string;
}

export interface TwelveDataSearchResponse {
  data: Array<{
    symbol: string;
    instrument_name: string;
    exchange: string;
    instrument_type: string;
    country: string;
  }>;
  status: string;
}

export interface TimeSeriesPoint {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TwelveDataTimeSeriesResponse {
  meta?: {
    symbol: string;
    interval: string;
  };
  values?: Array<{
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>;
  status?: string;
  message?: string;
}

export interface NormalizedNewsItem {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  snippet: string;
}

export interface TwelveDataNewsResponse {
  data?: Array<{
    title: string;
    source: string;
    datetime: string;
    url: string;
    description?: string;
  }>;
  status?: string;
}

export class MarketDataError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NETWORK_ERROR"
      | "API_ERROR"
      | "RATE_LIMIT"
      | "PARSE_ERROR",
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "MarketDataError";
  }
}
