import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">Workshop Boilerplate</h1>
      <p className="text-muted-foreground text-lg">
        Next.js + Supabase + Prisma + Tailwind + shadcn/ui
      </p>
      {user ? (
        <div className="flex flex-col items-center gap-4">
          <p>Welcome, {user.user_metadata?.full_name ?? user.email}!</p>
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
            >
              Go to Dashboard
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      ) : (
        <Link
          href="/auth/signin"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
        >
          Sign In
        </Link>
      )}
    </div>
  );
}
