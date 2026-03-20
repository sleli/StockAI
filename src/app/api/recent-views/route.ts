import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const dbUser = await getDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const views = await prisma.recentView.findMany({
    where: { userId: dbUser.id },
    orderBy: { viewedAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    views: views.map((v) => ({
      symbol: v.symbol,
      name: v.name,
      viewedAt: v.viewedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const dbUser = await getDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { symbol?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  await prisma.recentView.upsert({
    where: {
      userId_symbol: { userId: dbUser.id, symbol: body.symbol },
    },
    update: { name: body.name, viewedAt: new Date() },
    create: {
      userId: dbUser.id,
      symbol: body.symbol,
      name: body.name,
    },
  });

  // Cleanup: keep only last 10
  const allViews = await prisma.recentView.findMany({
    where: { userId: dbUser.id },
    orderBy: { viewedAt: "desc" },
    select: { id: true },
  });

  if (allViews.length > 10) {
    const idsToDelete = allViews.slice(10).map((v) => v.id);
    await prisma.recentView.deleteMany({
      where: { id: { in: idsToDelete } },
    });
  }

  return NextResponse.json({ success: true });
}
