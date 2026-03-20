"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SymbolSearch } from "@/components/symbol-search";
import { useQuotePolling } from "@/hooks/use-quote-polling";
import { SortControls, type SortField, type SortDirection } from "@/components/sort-controls";
import { QuoteStatusBadge } from "@/components/quote-status-badge";
import { RateLimitBanner } from "@/components/rate-limit-banner";
import { AlertBadge } from "@/components/alert-badge";
import { NotePopover } from "@/components/note-popover";
import { getQuoteStatus } from "@/lib/quote-status";
import type { SymbolSearchResult } from "@/lib/market-data";

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "adesso";
  if (diffMin < 60) return `${diffMin} min fa`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h fa`;
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface WatchlistSymbol {
  ticker: string;
  name: string;
  exchange: string;
}

interface WatchlistItem {
  id: string;
  sortOrder: number;
  note?: string | null;
  symbol: WatchlistSymbol;
}

interface Watchlist {
  id: string;
  name: string;
  items: WatchlistItem[];
}

const SUGGESTED_TICKERS = [
  { symbol: "AAPL", name: "Apple Inc", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla Inc", exchange: "NASDAQ" },
];

interface WatchlistPanelProps {
  watchlistId?: string | null;
}

export function WatchlistPanel({ watchlistId }: WatchlistPanelProps = {}) {
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const router = useRouter();

  useEffect(() => {
    async function fetchInterval() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.refreshInterval) {
            setRefreshInterval(data.refreshInterval * 1000);
          }
        }
      } catch {
        // Keep default
      }
    }
    fetchInterval();
  }, []);

  const fetchWatchlist = useCallback(async () => {
    try {
      const url = watchlistId
        ? `/api/watchlist?id=${watchlistId}`
        : "/api/watchlist";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Errore nel caricamento della watchlist");
      }
      const data = await res.json();
      setWatchlist(data.watchlist);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Errore nel caricamento"
      );
    } finally {
      setIsLoading(false);
    }
  }, [watchlistId]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const symbols = useMemo(
    () => (watchlist?.items ?? []).map((item) => item.symbol.ticker),
    [watchlist]
  );

  const {
    quotes,
    isRefreshing,
    lastUpdated,
    refresh,
    isMarketOpen: marketOpen,
    hasError: pollingError,
    isRateLimited,
    triggeredAlerts,
  } = useQuotePolling(symbols, refreshInterval);

  const triggeredTickers = new Set(
    triggeredAlerts.map((a) => a.symbol.ticker)
  );

  const quoteStatus = getQuoteStatus(lastUpdated, marketOpen, pollingError);

  const quotesLoading = isRefreshing && Object.keys(quotes).length === 0;

  const [sortBy, setSortBy] = useState<SortField>("manual");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortBy(field);
    setSortDirection(direction);
  };

  const sortedItems = useMemo(() => {
    const itemsCopy = [...(watchlist?.items ?? [])];

    if (sortBy === "manual") {
      return itemsCopy.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return itemsCopy.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.symbol.name.localeCompare(b.symbol.name);
          break;
        case "price": {
          const priceA = quotes[a.symbol.ticker]?.price;
          const priceB = quotes[b.symbol.ticker]?.price;
          if (priceA === undefined && priceB === undefined) comparison = 0;
          else if (priceA === undefined) comparison = 1;
          else if (priceB === undefined) comparison = -1;
          else comparison = priceA - priceB;
          break;
        }
        case "change": {
          const changeA = quotes[a.symbol.ticker]?.changePercent;
          const changeB = quotes[b.symbol.ticker]?.changePercent;
          if (changeA === undefined && changeB === undefined) comparison = 0;
          else if (changeA === undefined) comparison = 1;
          else if (changeB === undefined) comparison = -1;
          else comparison = changeA - changeB;
          break;
        }
      }

      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [watchlist?.items, sortBy, sortDirection, quotes]);

  const addItem = async (result: SymbolSearchResult) => {
    if (!watchlist) return;

    if (watchlist.items.some((item) => item.symbol.ticker === result.symbol)) {
      setFeedback("Titolo già in watchlist");
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const optimisticItem: WatchlistItem = {
      id: `temp-${Date.now()}`,
      sortOrder: watchlist.items.length,
      symbol: {
        ticker: result.symbol,
        name: result.name,
        exchange: result.exchange,
      },
    };

    setWatchlist({
      ...watchlist,
      items: [...watchlist.items, optimisticItem],
    });
    setShowSearch(false);

    try {
      const res = await fetch("/api/watchlist/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: result.symbol,
          name: result.name,
          exchange: result.exchange,
        }),
      });

      if (res.status === 409) {
        setWatchlist((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.filter((item) => item.id !== optimisticItem.id),
          };
        });
        setFeedback("Titolo già in watchlist");
        setTimeout(() => setFeedback(null), 3000);
        return;
      }

      if (!res.ok) {
        setWatchlist((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.filter((item) => item.id !== optimisticItem.id),
          };
        });
        setFeedback("Errore nell'aggiunta del titolo");
        setTimeout(() => setFeedback(null), 3000);
        return;
      }

      const data = await res.json();
      setWatchlist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === optimisticItem.id
              ? { ...data.item, sortOrder: optimisticItem.sortOrder }
              : item
          ),
        };
      });
    } catch {
      setWatchlist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.filter((item) => item.id !== optimisticItem.id),
        };
      });
      setFeedback("Errore di rete");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!watchlist) return;

    const removedItem = watchlist.items.find((item) => item.id === itemId);
    if (!removedItem) return;

    setWatchlist((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      };
    });

    try {
      const res = await fetch(`/api/watchlist/items/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setWatchlist((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: [...prev.items, removedItem].sort(
              (a, b) => a.sortOrder - b.sortOrder
            ),
          };
        });
        setFeedback("Errore nella rimozione del titolo");
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      setWatchlist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: [...prev.items, removedItem].sort(
            (a, b) => a.sortOrder - b.sortOrder
          ),
        };
      });
      setFeedback("Errore di rete");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleSuggestedClick = (suggested: typeof SUGGESTED_TICKERS[number]) => {
    addItem({
      symbol: suggested.symbol,
      name: suggested.name,
      exchange: suggested.exchange,
      type: "",
      country: "",
    });
  };

  if (isLoading) {
    return (
      <div className="watchlist-card">
        <div className="flex items-center justify-center py-12">
          <p className="mini-label">Caricamento watchlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="watchlist-card">
        <div className="py-6">
          <p className="text-stock-down text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const items = watchlist?.items ?? [];

  return (
    <div className="watchlist-card">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-xl">{watchlist?.name ?? "Watchlist"}</h2>
          {items.length > 0 && (
            <QuoteStatusBadge status={quoteStatus} />
          )}
          {isRefreshing && (
            <span className="text-xs text-stock-up animate-pulse" aria-label="Aggiornamento in corso">
              ●
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              type="button"
              className="chip"
              onClick={refresh}
              disabled={isRefreshing}
              aria-label="Aggiorna quote"
            >
              ↻
            </button>
          )}
          <button
            type="button"
            className="chip"
            onClick={() => setShowSearch(!showSearch)}
          >
            {showSearch ? "Chiudi" : "Aggiungi"}
          </button>
          {selectedForCompare.size >= 2 && (
            <button
              type="button"
              className="action-btn text-sm"
              onClick={() =>
                router.push(
                  `/stocks/compare?symbols=${Array.from(selectedForCompare).join(",")}`
                )
              }
            >
              Confronta ({selectedForCompare.size})
            </button>
          )}
        </div>
      </div>

      <RateLimitBanner isRateLimited={isRateLimited} hasError={pollingError} />

      {feedback && (
        <div className="rounded-[18px] border border-[var(--line)] bg-[rgba(255,251,245,0.78)] px-4 py-2 text-sm text-[var(--muted-tone)] mb-3" role="status">
          {feedback}
        </div>
      )}

      {showSearch && (
        <div className="mb-4">
          <SymbolSearch onSelect={addItem} />
        </div>
      )}

      {items.length > 0 && (
        <div className="mb-3">
          <SortControls
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
          />
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <p className="mini-label">
            La tua watchlist è vuota. Inizia aggiungendo dei titoli!
          </p>
          <div className="flex gap-2">
            {SUGGESTED_TICKERS.map((suggested) => (
              <button
                key={suggested.symbol}
                onClick={() => handleSuggestedClick(suggested)}
                className="chip"
              >
                {suggested.symbol}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="action-btn text-sm"
            onClick={() => setShowSearch(true)}
          >
            Cerca un titolo
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {sortedItems.map((item) => {
            const quote = quotes[item.symbol.ticker];
            const changeColor = quote
              ? quote.change > 0
                ? "text-stock-up"
                : quote.change < 0
                  ? "text-stock-down"
                  : ""
              : "";
            const changeSign = quote && quote.change > 0 ? "+" : "";
            const isTriggered = triggeredTickers.has(item.symbol.ticker);

            return (
              <div
                key={item.id}
                className={`watch-item ${isTriggered ? "border-l-2 !border-l-[var(--gold)]" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedForCompare.has(item.symbol.ticker)}
                      disabled={
                        !selectedForCompare.has(item.symbol.ticker) &&
                        selectedForCompare.size >= 5
                      }
                      onChange={() => {
                        setSelectedForCompare((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.symbol.ticker)) {
                            next.delete(item.symbol.ticker);
                          } else {
                            next.add(item.symbol.ticker);
                          }
                          return next;
                        });
                      }}
                      className="shrink-0 accent-[var(--green)]"
                      aria-label={`Seleziona ${item.symbol.ticker} per confronto`}
                    />
                    {isTriggered && <AlertBadge status="triggered" />}
                    <Link
                      href={`/stocks/${item.symbol.ticker}`}
                      className="flex min-w-0 flex-1 items-center gap-2 hover:opacity-70 transition-opacity"
                    >
                      <strong className="font-mono text-sm">{item.symbol.ticker}</strong>
                      <span className="flex-1 truncate text-sm" style={{ color: "rgba(23,20,16,0.64)" }}>
                        {item.symbol.name}
                      </span>
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    {quote ? (
                      <span className={`font-mono text-sm font-semibold ${changeColor}`}>
                        {changeSign}{quote.changePercent.toFixed(2)}%
                      </span>
                    ) : quotesLoading ? (
                      <span className="mini-label">...</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    {quote && (
                      <span className="font-mono font-semibold">
                        ${quote.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {quote && (
                      <span
                        className="mini-label"
                        title={quote.timestamp}
                        style={{
                          color: formatTimestamp(quote.timestamp) === "adesso"
                            ? "var(--green)"
                            : "var(--gold)",
                        }}
                      >
                        {formatTimestamp(quote.timestamp)}
                      </span>
                    )}
                    <NotePopover
                      itemId={item.id}
                      ticker={item.symbol.ticker}
                      initialNote={item.note ?? null}
                      onSaved={(note) => {
                        setWatchlist((prev) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            items: prev.items.map((i) =>
                              i.id === item.id ? { ...i, note } : i
                            ),
                          };
                        });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded p-1 text-[var(--muted-tone)] transition-colors hover:text-stock-down"
                      aria-label={`Rimuovi ${item.symbol.ticker}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lastUpdated && items.length > 0 && (
        <p className="mt-4 text-right mini-label">
          Ultimo aggiornamento: {formatTimestamp(lastUpdated.toISOString())}
        </p>
      )}
    </div>
  );
}
