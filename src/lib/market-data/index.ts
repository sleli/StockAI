import { TwelveDataProvider } from "./twelve-data";
import type { MarketDataProvider } from "./provider";

export function createMarketDataProvider(): MarketDataProvider {
  return new TwelveDataProvider();
}

export type { MarketDataProvider } from "./provider";
export type { NormalizedQuote, SymbolSearchResult, TimeSeriesPoint, NormalizedNewsItem } from "./types";
export { MarketDataError } from "./types";
