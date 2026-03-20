"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WatchlistInfo {
  id: string;
  name: string;
  itemCount: number;
}

interface WatchlistSelectorProps {
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function WatchlistSelector({
  activeId,
  onSelect,
}: WatchlistSelectorProps) {
  const [watchlists, setWatchlists] = useState<WatchlistInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const fetchWatchlists = useCallback(async () => {
    try {
      const res = await fetch("/api/watchlists");
      if (res.ok) {
        const data = await res.json();
        setWatchlists(data.watchlists ?? []);
        if (!activeId && data.watchlists?.length > 0) {
          onSelect(data.watchlists[0].id);
        }
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [activeId, onSelect]);

  useEffect(() => {
    fetchWatchlists();
  }, [fetchWatchlists]);

  const createWatchlist = async () => {
    if (!newName.trim()) return;

    try {
      const res = await fetch("/api/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setWatchlists((prev) => [...prev, data.watchlist]);
        onSelect(data.watchlist.id);
        setNewName("");
        setCreateOpen(false);
      }
    } catch {
      // Silent fail
    }
  };

  const deleteWatchlist = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa watchlist?")) return;

    try {
      const res = await fetch(`/api/watchlists/${id}`, { method: "DELETE" });
      if (res.ok) {
        const remaining = watchlists.filter((wl) => wl.id !== id);
        setWatchlists(remaining);
        if (activeId === id && remaining.length > 0) {
          onSelect(remaining[0].id);
        }
      }
    } catch {
      // Silent fail
    }
  };

  if (isLoading) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {watchlists.map((wl) => (
        <div key={wl.id} className="flex items-center gap-1">
          <button
            type="button"
            className={`chip ${activeId === wl.id ? "active" : ""}`}
            onClick={() => onSelect(wl.id)}
          >
            {wl.name}
            <span className="ml-1 opacity-60">({wl.itemCount})</span>
          </button>
          {watchlists.length > 1 && (
            <button
              type="button"
              onClick={() => deleteWatchlist(wl.id)}
              className="rounded p-0.5 text-xs text-[var(--muted-tone)] hover:text-stock-down transition-colors"
              aria-label={`Elimina ${wl.name}`}
            >
              ×
            </button>
          )}
        </div>
      ))}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger render={<button type="button" className="chip" />}>
          +
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova watchlist</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome watchlist"
              maxLength={50}
            />
            <button
              type="button"
              className="action-btn text-sm"
              onClick={createWatchlist}
              disabled={!newName.trim()}
            >
              Crea
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
