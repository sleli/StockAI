"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface NotePopoverProps {
  itemId: string;
  ticker: string;
  initialNote: string | null;
  onSaved?: (note: string | null) => void;
}

export function NotePopover({
  itemId,
  ticker,
  initialNote,
  onSaved,
}: NotePopoverProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(initialNote ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/watchlist/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() || null }),
      });

      if (res.ok) {
        onSaved?.(note.trim() || null);
        setOpen(false);
      }
    } catch {
      // Silent fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className={`rounded p-1 text-xs transition-colors ${
              initialNote
                ? "text-primary hover:text-primary/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={initialNote ? "Modifica nota" : "Aggiungi nota"}
          />
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
        </svg>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nota per {ticker}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Scrivi una nota..."
            rows={4}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {note.length}/500
            </span>
            <div className="flex gap-2">
              {initialNote && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNote("");
                    handleSave();
                  }}
                >
                  Elimina nota
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Salvataggio..." : "Salva"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
