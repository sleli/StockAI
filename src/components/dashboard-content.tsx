"use client";

import { useState, useCallback } from "react";
import { WatchlistSelector } from "@/components/watchlist-selector";
import { WatchlistPanel } from "@/components/watchlist-panel";
import { AlertList } from "@/components/alert-list";
import { RecentlyViewed } from "@/components/recently-viewed";

export function DashboardContent() {
  const [activeWatchlistId, setActiveWatchlistId] = useState<string | null>(
    null
  );

  const handleSelect = useCallback((id: string) => {
    setActiveWatchlistId(id);
  }, []);

  return (
    <section className="main-grid">
      {/* Left column: watchlist */}
      <div className="flex flex-col gap-4 rise rise-delay-2">
        <WatchlistSelector activeId={activeWatchlistId} onSelect={handleSelect} />
        <WatchlistPanel watchlistId={activeWatchlistId} />
      </div>

      {/* Right column: alerts + recently viewed */}
      <div className="detail-stack rise rise-delay-3">
        <AlertList />
        <RecentlyViewed />
      </div>
    </section>
  );
}
