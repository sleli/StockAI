"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AlertFormProps {
  symbolId: string;
  ticker: string;
  currentPrice?: number;
  onCreated?: () => void;
}

export function AlertForm({
  symbolId,
  ticker,
  currentPrice,
  onCreated,
}: AlertFormProps) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [threshold, setThreshold] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const value = parseFloat(threshold);
    if (isNaN(value) || value <= 0) {
      setError("Inserisci un valore valido maggiore di zero");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbolId, direction, threshold: value }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Errore nella creazione dell'alert");
      }

      setThreshold("");
      setOpen(false);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm">
          Crea alert
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crea alert per {ticker}</DialogTitle>
        </DialogHeader>

        {currentPrice !== undefined && (
          <p className="text-sm text-muted-foreground">
            Prezzo attuale:{" "}
            <span className="font-mono font-semibold text-foreground">
              {currentPrice.toFixed(2)}
            </span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={direction === "above" ? "default" : "outline"}
              size="sm"
              onClick={() => setDirection("above")}
            >
              ↑ Sopra
            </Button>
            <Button
              type="button"
              variant={direction === "below" ? "default" : "outline"}
              size="sm"
              onClick={() => setDirection("below")}
            >
              ↓ Sotto
            </Button>
          </div>

          <div>
            <Label htmlFor="threshold">Soglia</Label>
            <Input
              id="threshold"
              type="number"
              step="0.01"
              min="0.01"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="Es. 150.00"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creazione..." : "Crea alert"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
