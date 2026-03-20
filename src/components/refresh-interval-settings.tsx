"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const INTERVAL_OPTIONS = [
  { value: 15, label: "15s", callsPerMin: 4 },
  { value: 30, label: "30s", callsPerMin: 2 },
  { value: 60, label: "1 min", callsPerMin: 1 },
  { value: 120, label: "2 min", callsPerMin: 0.5 },
  { value: 300, label: "5 min", callsPerMin: 0.2 },
];

export function RefreshIntervalSettings() {
  const [interval, setInterval] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setInterval(data.refreshInterval ?? 30);
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleChange = async (newValue: number) => {
    const oldValue = interval;
    setInterval(newValue);
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshInterval: newValue }),
      });

      if (!res.ok) {
        setInterval(oldValue);
      }
    } catch {
      setInterval(oldValue);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        </CardContent>
      </Card>
    );
  }

  const currentOption = INTERVAL_OPTIONS.find((o) => o.value === interval);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequenza di aggiornamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Intervallo di polling</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Quanto spesso vengono aggiornate le quote. Intervalli piu lunghi consumano meno chiamate API.
          </p>
          <div className="flex flex-wrap gap-2">
            {INTERVAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleChange(option.value)}
                disabled={saving}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  interval === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {currentOption && (
          <p className="text-sm text-muted-foreground">
            ~{currentOption.callsPerMin >= 1
              ? `${currentOption.callsPerMin} chiamate/min`
              : `1 chiamata ogni ${Math.round(1 / currentOption.callsPerMin)} min`}
            {" "}per simbolo
            {saving && " — Salvataggio..."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
