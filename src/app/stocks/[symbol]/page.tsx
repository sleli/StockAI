import Link from "next/link";
import { StockDetail } from "@/components/stock-detail";

interface StockPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function StockPage({ params }: StockPageProps) {
  const { symbol } = await params;
  const ticker = decodeURIComponent(symbol).toUpperCase();

  return (
    <main className="shell">
      <div className="mb-4">
        <Link
          href="/dashboard"
          className="chip inline-flex items-center gap-1 no-underline"
        >
          ← Torna alla dashboard
        </Link>
      </div>

      <StockDetail symbol={ticker} />
    </main>
  );
}
