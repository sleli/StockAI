"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { NormalizedQuote } from "@/lib/market-data";
import { isMarketOpen } from "@/lib/market-hours";

interface TriggeredAlert {
  id: string;
  direction: string;
  threshold: number;
  triggeredPrice: number | null;
  symbol: { ticker: string; name: string };
}

interface UseQuotePollingResult {
  quotes: Record<string, NormalizedQuote>;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
  isMarketOpen: boolean;
  triggeredAlerts: TriggeredAlert[];
  hasError: boolean;
  isRateLimited: boolean;
}

const DEFAULT_INTERVAL = 30000; // 30 seconds
const BACKOFF_INTERVAL = 60000; // 60 seconds on 429

export function useQuotePolling(
  symbols: string[],
  interval = DEFAULT_INTERVAL
): UseQuotePollingResult {
  const [quotes, setQuotes] = useState<Record<string, NormalizedQuote>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [marketOpen, setMarketOpen] = useState(() => isMarketOpen());
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backoffRef = useRef(false);
  const symbolsKey = symbols.join(",");

  const fetchQuotes = useCallback(async () => {
    if (symbols.length === 0) return;

    setIsRefreshing(true);
    try {
      const res = await fetch(
        `/api/quotes/batch?symbols=${symbols.join(",")}`
      );

      if (res.status === 429) {
        backoffRef.current = true;
        setIsRateLimited(true);
        return;
      }

      if (res.ok) {
        setHasError(false);
        setIsRateLimited(false);
        const data = await res.json();
        const fetchedQuotes = data.quotes ?? {};
        setQuotes(fetchedQuotes);
        setLastUpdated(new Date());
        backoffRef.current = false;

        // Evaluate alerts with current quotes
        try {
          const quotesForEval: Record<string, { price: number }> = {};
          for (const [ticker, q] of Object.entries(fetchedQuotes)) {
            quotesForEval[ticker] = { price: (q as NormalizedQuote).price };
          }

          const evalRes = await fetch("/api/alerts/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quotes: quotesForEval }),
          });

          if (evalRes.ok) {
            const evalData = await evalRes.json();
            if (evalData.triggered?.length > 0) {
              setTriggeredAlerts(evalData.triggered);
            }
          }
        } catch {
          // Don't block polling on evaluate failure
        }
      }
    } catch {
      setHasError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [symbolsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const open = isMarketOpen();
      setMarketOpen(open);

      if (!open) return;
      if (backoffRef.current) {
        backoffRef.current = false; // Reset backoff, try again next cycle
        return;
      }

      fetchQuotes();
    }, backoffRef.current ? BACKOFF_INTERVAL : interval);
  }, [fetchQuotes, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchQuotes();
    // Reset the timer
    stopPolling();
    startPolling();
  }, [fetchQuotes, stopPolling, startPolling]);

  // Initial fetch and start polling
  useEffect(() => {
    fetchQuotes();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [fetchQuotes, startPolling, stopPolling]);

  // Pause on tab hidden, resume on tab visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        setMarketOpen(isMarketOpen());
        fetchQuotes();
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchQuotes, startPolling, stopPolling]);

  return {
    quotes,
    isRefreshing,
    lastUpdated,
    refresh,
    isMarketOpen: marketOpen,
    triggeredAlerts,
    hasError,
    isRateLimited,
  };
}
