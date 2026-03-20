"use client";

import type { QuoteStatus } from "@/lib/quote-status";

const STATUS_CONFIG: Record<
  QuoteStatus,
  { label: string; dotColor: string }
> = {
  fresh: {
    label: "Aggiornato",
    dotColor: "var(--green)",
  },
  stale: {
    label: "Non aggiornato",
    dotColor: "var(--gold)",
  },
  closed: {
    label: "Mercato chiuso",
    dotColor: "var(--muted-tone)",
  },
  error: {
    label: "Errore",
    dotColor: "var(--red)",
  },
};

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
}

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest"
      style={{ color: config.dotColor }}
      data-testid="quote-status-badge"
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{
          background: config.dotColor,
          boxShadow: `0 0 0 4px color-mix(in srgb, ${config.dotColor} 15%, transparent)`,
        }}
      />
      {config.label}
    </span>
  );
}
