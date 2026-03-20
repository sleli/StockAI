"use client";

import { useState, useEffect, useCallback } from "react";

interface AlertSymbol {
  id: string;
  ticker: string;
  name: string;
  exchange: string;
}

interface Alert {
  id: string;
  direction: string;
  threshold: number;
  status: string;
  triggeredAt: string | null;
  triggeredPrice: number | null;
  symbol: AlertSymbol;
}

const STATUS_STYLES: Record<string, string> = {
  active: "text-stock-up border-[var(--green-soft)]",
  triggered: "text-stock-down border-[var(--red)]",
  disabled: "text-[var(--muted-tone)] border-[var(--line)]",
  dismissed: "text-[var(--muted-tone)] border-[var(--line)]",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Attivo",
  triggered: "Attivato",
  disabled: "Disattivato",
  dismissed: "Confermato",
};

export function AlertList() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts ?? []);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        );
      }
    } catch {
      // Silent fail
    }
  };

  const deleteAlert = async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));

    try {
      const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        fetchAlerts();
      }
    } catch {
      fetchAlerts();
    }
  };

  if (isLoading) {
    return (
      <div className="alert-card-panel">
        <div className="py-6">
          <p className="mini-label">Caricamento alert...</p>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="alert-card-panel">
        <div className="py-6">
          <p className="mini-label">
            Nessun alert configurato.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="alert-card-panel">
      <div className="mini-label mb-2">Alert logic</div>
      <h3 className="font-serif text-xl mb-4">Simple thresholds, calm confidence.</h3>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="tag text-stock-up">fresh</span>
        <span className="tag text-stock-stale">stale</span>
        <span className="tag text-stock-down">triggered</span>
        <span className="tag">closed</span>
      </div>

      <div className="grid gap-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="alert-row">
            <div className="flex items-center gap-3 min-w-0">
              <div>
                <div className="mini-label">{alert.symbol.ticker}</div>
                <div className="text-sm font-mono">
                  {alert.direction === "above" ? "↑" : "↓"}{" "}
                  ${alert.threshold.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`tag text-xs ${STATUS_STYLES[alert.status] ?? ""}`}
              >
                {STATUS_LABELS[alert.status] ?? alert.status}
              </span>
              {alert.status === "triggered" && (
                <span className="mini-label">
                  {alert.triggeredPrice !== null && `@ $${alert.triggeredPrice.toFixed(2)}`}
                  {alert.triggeredAt && ` · ${new Date(alert.triggeredAt).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`}
                </span>
              )}
              <div className="flex gap-1">
                {alert.status === "triggered" && (
                  <button
                    type="button"
                    className="chip text-xs"
                    onClick={() => updateStatus(alert.id, "dismissed")}
                  >
                    Conferma
                  </button>
                )}
                {alert.status === "active" && (
                  <button
                    type="button"
                    className="chip text-xs"
                    onClick={() => updateStatus(alert.id, "disabled")}
                  >
                    Disattiva
                  </button>
                )}
                {alert.status === "disabled" && (
                  <button
                    type="button"
                    className="chip text-xs"
                    onClick={() => updateStatus(alert.id, "active")}
                  >
                    Riattiva
                  </button>
                )}
                <button
                  type="button"
                  className="chip text-xs text-stock-down hover:!border-[var(--red)]"
                  onClick={() => deleteAlert(alert.id)}
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
