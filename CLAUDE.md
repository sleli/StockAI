# CLAUDE.md — Workshop Boilerplate

## Stack
- **Next.js 15** (App Router, `src/` directory, Turbopack dev)
- **Supabase** for auth (OAuth via GitHub & Google managed providers) and storage
- **Prisma** for database access (connected to Supabase PostgreSQL)
- **Tailwind CSS v4** with `@tailwindcss/postcss`
- **shadcn/ui** for UI components

## File Structure
```
src/
  app/
    layout.tsx          # Root layout (Geist font, globals.css)
    page.tsx            # Home page (server component)
    providers.tsx       # Client wrapper (extensible)
    globals.css         # Tailwind + shadcn CSS vars
    dashboard/
      page.tsx          # Protected page (middleware guards)
    auth/
      signin/page.tsx   # Sign-in page (GitHub + Google OAuth)
      callback/route.ts # OAuth callback handler + Prisma user sync
      signout/route.ts  # POST handler for sign out
    api/
      hello/route.ts    # Example API route (GET + POST)
  components/ui/        # shadcn/ui components
  lib/
    utils.ts            # cn() utility (shadcn)
    prisma.ts           # Prisma client singleton
    supabase/
      client.ts         # Browser Supabase client
      server.ts         # Server Supabase client (cookies)
      middleware.ts      # Session refresh helper
  middleware.ts          # Protects /dashboard, refreshes session
prisma/
  schema.prisma         # User model (UUID, supabaseId, email, name, image)
```

## Common Tasks

### Add a shadcn/ui component
```bash
npx shadcn@latest add <component-name>
```

### Extend the Prisma schema
1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Use `prisma` from `@/lib/prisma` to query

### Query with Prisma
```ts
import { prisma } from "@/lib/prisma";
const users = await prisma.user.findMany();
```

### Auth Patterns

**Server Component** (recommended):
```ts
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
```

**Client Component**:
```ts
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

**Sign in with OAuth** (client-side):
```ts
const supabase = createClient();
await supabase.auth.signInWithOAuth({
  provider: "github", // or "google"
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});
```

**User sync**: On OAuth callback, the user is automatically synced to Prisma via `prisma.user.upsert()` using `supabaseId` as the key. This keeps the `User` table in sync with Supabase Auth.

### Supabase Storage
```ts
const supabase = createClient(); // or await createClient() on server
const { data } = await supabase.storage.from("bucket").upload("path", file);
```

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `DATABASE_URL` — Supabase PostgreSQL connection string (for Prisma)
