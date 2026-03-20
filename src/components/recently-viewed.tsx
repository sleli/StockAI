"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RecentViewItem {
  symbol: string;
  name: string | null;
  viewedAt: string;
}

export function RecentlyViewed() {
  const [views, setViews] = useState<RecentViewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchViews() {
      try {
        const res = await fetch("/api/recent-views");
        if (res.ok) {
          const data = await res.json();
          setViews(data.views ?? []);
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false);
      }
    }
    fetchViews();
  }, []);

  if (isLoading) return null;
  if (views.length === 0) return null;

  return (
    <div className="alert-card-panel">
      <div className="mini-label mb-2">Recently viewed</div>
      <h3 className="font-serif text-lg mb-4">Visti di recente</h3>
      <div className="flex flex-wrap gap-2">
        {views.map((view) => (
          <Link
            key={view.symbol}
            href={`/stocks/${view.symbol}`}
            className="chip inline-flex items-center gap-1.5 no-underline"
          >
            <span className="font-mono font-bold">{view.symbol}</span>
            {view.name && (
              <span style={{ color: "var(--muted-tone)" }}>{view.name}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
