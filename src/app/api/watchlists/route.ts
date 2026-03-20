import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const dbUser = await getDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const watchlists = await prisma.watchlist.findMany({
    where: { userId: dbUser.id },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    watchlists: watchlists.map((wl) => ({
      id: wl.id,
      name: wl.name,
      itemCount: wl._count.items,
    })),
  });
}

export async function POST(request: NextRequest) {
  const dbUser = await getDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { name } = body;

  if (!name || !name.trim() || name.length > 50) {
    return NextResponse.json(
      { error: "Name is required and must be 50 characters or less" },
      { status: 400 }
    );
  }

  const watchlist = await prisma.watchlist.create({
    data: { name: name.trim(), userId: dbUser.id },
  });

  return NextResponse.json(
    { watchlist: { id: watchlist.id, name: watchlist.name, itemCount: 0 } },
    { status: 201 }
  );
}
