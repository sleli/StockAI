import { NormalizedQuote, SymbolSearchResult, TimeSeriesPoint, NormalizedNewsItem } from "./types";

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<NormalizedQuote>;
  getQuotes(symbols: string[]): Promise<Record<string, NormalizedQuote>>;
  searchSymbol(query: string): Promise<SymbolSearchResult[]>;
  getTimeSeries(symbol: string, interval: string, outputsize: number): Promise<TimeSeriesPoint[]>;
  getNews(symbol: string): Promise<NormalizedNewsItem[]>;
}
