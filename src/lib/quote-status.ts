export type QuoteStatus = "fresh" | "stale" | "closed" | "error";

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function getQuoteStatus(
  lastUpdated: Date | null,
  isMarketOpen: boolean,
  hasError: boolean
): QuoteStatus {
  if (hasError) return "error";
  if (!isMarketOpen) return "closed";
  if (!lastUpdated) return "stale";

  const elapsed = Date.now() - lastUpdated.getTime();
  if (elapsed > STALE_THRESHOLD_MS) return "stale";

  return "fresh";
}
