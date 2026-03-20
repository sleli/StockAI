import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Gets the authenticated Supabase user and ensures they exist in Prisma.
 * Auto-creates the Prisma user if missing (handles email/password login
 * which doesn't go through the OAuth callback).
 */
export async function getDbUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  console.log("[getDbUser] supabase.auth.getUser():", { user: data.user?.id, email: data.user?.email, error: error?.message });

  const user = data.user;
  if (!user) return null;

  const dbUser = await prisma.user.upsert({
    where: { supabaseId: user.id },
    update: {
      email: user.email!,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      image: user.user_metadata?.avatar_url ?? null,
    },
    create: {
      supabaseId: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      image: user.user_metadata?.avatar_url ?? null,
    },
  });

  return dbUser;
}
