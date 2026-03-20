"use client";

import { useState, useRef, useCallback } from "react";
import type { SymbolSearchResult } from "@/lib/market-data";

interface SymbolSearchProps {
  onSelect?: (result: SymbolSearchResult) => void;
  placeholder?: string;
}

export function SymbolSearch({
  onSelect,
  placeholder = "Cerca per ticker o nome...",
}: SymbolSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SymbolSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Errore nella ricerca");
      }

      const data = await res.json();
      setResults(data.results ?? []);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nella ricerca");
      setResults([]);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      search(value);
    }, 300);
  };

  return (
    <div className="w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Cerca titolo"
        className="w-full rounded-[16px] border border-[var(--line)] bg-[rgba(255,252,247,0.92)] px-4 py-3.5 text-[var(--ink)] placeholder:text-[var(--muted-tone)] focus:outline-none focus:ring-2 focus:ring-[var(--green)] font-sans"
      />

      {isLoading && (
        <div className="mt-2 mini-label" role="status">
          Ricerca in corso...
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-stock-down" role="alert">
          {error}
        </div>
      )}

      {!isLoading && !error && hasSearched && results.length === 0 && (
        <div className="mt-2 mini-label">
          Nessun titolo trovato
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-2 grid gap-2">
          {results.map((result) => (
            <button
              key={`${result.symbol}-${result.exchange}`}
              type="button"
              className="watch-item flex items-center gap-3 text-left"
              onClick={() => onSelect?.(result)}
            >
              <span className="font-mono text-sm font-bold">
                {result.symbol}
              </span>
              <span className="flex-1 truncate text-sm">{result.name}</span>
              <span className="mini-label">
                {result.exchange}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
