import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardContent } from "@/components/dashboard-content";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name = user?.user_metadata?.full_name ?? user?.email ?? "User";
  const email = user?.email ?? "";
  const avatarUrl = user?.user_metadata?.avatar_url ?? "";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <main className="shell">
      {/* Topbar: user card (left) + market overview (right) */}
      <section className="topbar rise rise-delay-1">
        <article className="section-card top-left">
          <div>
            <div className="eyebrow flex items-center gap-2.5">
              <span className="dot" />
              StockAI / Calm market intelligence
            </div>
            <h1
              className="mt-3.5 font-serif"
              style={{
                fontSize: "clamp(2.8rem, 6vw, 5rem)",
                letterSpacing: "-0.05em",
                maxWidth: "12ch",
              }}
            >
              Watch the market without the noise.
            </h1>
          </div>

          <div className="mt-6 flex items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback className="bg-[var(--green)] text-[var(--paper)] font-serif text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-serif text-xl font-semibold leading-tight">{name}</p>
                <p className="mini-label mt-1">{email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard/settings"
                className="chip"
              >
                Impostazioni
              </Link>
              <Link href="/" className="chip">
                Home
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="chip"
                  style={{ borderColor: "var(--red)", color: "var(--red)" }}
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </article>

        <aside className="top-right">
          <div className="flex justify-between items-start gap-3">
            <div>
              <div className="mini-label">Session health</div>
              <div
                className="font-serif mt-2"
                style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", lineHeight: 0.95, letterSpacing: "-0.04em" }}
              >
                Fresh data, explained.
              </div>
            </div>
          </div>

          <div className="scoreboard">
            <div className="score">
              <div className="mini-label">Tracked</div>
              <strong className="font-mono">--</strong>
            </div>
            <div className="score">
              <div className="mini-label">Alerts</div>
              <strong className="font-mono">--</strong>
            </div>
            <div className="score">
              <div className="mini-label">Status</div>
              <strong className="font-mono text-sm">Live</strong>
            </div>
          </div>
        </aside>
      </section>

      {/* Main content grid */}
      <DashboardContent />
    </main>
  );
}
