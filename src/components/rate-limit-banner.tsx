"use client";

interface RateLimitBannerProps {
  isRateLimited: boolean;
  hasError: boolean;
}

export function RateLimitBanner({
  isRateLimited,
  hasError,
}: RateLimitBannerProps) {
  if (!isRateLimited && !hasError) return null;

  return (
    <div
      className={`rounded-[18px] border px-4 py-3 text-sm mb-3 ${
        isRateLimited
          ? "border-[var(--gold)] bg-[rgba(166,118,49,0.08)] text-[var(--gold)]"
          : "border-[var(--red)] bg-[rgba(161,61,48,0.08)] text-stock-down"
      }`}
      role="alert"
    >
      {isRateLimited
        ? "Limite API raggiunto. Il refresh riprenderà automaticamente."
        : "Errore nel recupero dei dati. Verranno mostrati gli ultimi dati disponibili."}
    </div>
  );
}
