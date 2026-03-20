import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";

export async function GET() {
  try {
    const dbUser = await getDbUser();
    return NextResponse.json({
      dbUser: dbUser ? { id: dbUser.id, email: dbUser.email, supabaseId: dbUser.supabaseId } : null,
    });
  } catch (err) {
    return NextResponse.json({
      error: String(err),
      stack: err instanceof Error ? err.stack : null,
    }, { status: 500 });
  }
}
