import Link from "next/link";
import { ComparisonChart } from "@/components/comparison-chart";

interface ComparePageProps {
  searchParams: Promise<{ symbols?: string }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { symbols: symbolsParam } = await searchParams;

  const symbols = (symbolsParam ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (symbols.length < 2 || symbols.length > 5) {
    return (
      <main className="shell">
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="mini-label">
            Seleziona da 2 a 5 titoli dalla watchlist per confrontarli.
          </p>
          <Link href="/dashboard" className="chip no-underline">
            Torna alla dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="mb-4">
        <Link href="/dashboard" className="chip inline-flex items-center gap-1 no-underline">
          ← Torna alla dashboard
        </Link>
      </div>

      <div className="detail-card">
        <div className="mini-label mb-2">Comparison</div>
        <h2 className="font-serif text-2xl mb-4">Confronto titoli</h2>
        <div className="flex gap-2 mb-6">
          {symbols.map((s) => (
            <span key={s} className="chip font-mono font-bold">
              {s}
            </span>
          ))}
        </div>
        <ComparisonChart symbols={symbols} />
      </div>
    </main>
  );
}
