"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NewsItem {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  snippet: string;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 60) return `${diffMin} min fa`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h fa`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}g fa`;
  return date.toLocaleDateString("it-IT");
}

interface StockNewsProps {
  symbol: string;
}

export function StockNews({ symbol }: StockNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch(
          `/api/stocks/${encodeURIComponent(symbol)}/news`
        );
        if (res.ok) {
          const data = await res.json();
          setNews(data.news ?? []);
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false);
      }
    }
    fetchNews();
  }, [symbol]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">Caricamento notizie...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notizie recenti</CardTitle>
      </CardHeader>
      <CardContent>
        {news.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nessuna notizia disponibile per questo titolo
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {news.map((item, idx) => (
              <li key={idx} className="py-3">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline"
                >
                  {item.title}
                </a>
                <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                  <span>{item.source}</span>
                  <span>·</span>
                  <span>{formatRelativeTime(item.publishedAt)}</span>
                </div>
                {item.snippet && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {item.snippet}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
