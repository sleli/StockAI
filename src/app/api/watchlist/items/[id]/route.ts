import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbUser = await getDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const item = await prisma.watchlistItem.findUnique({
    where: { id },
    include: { watchlist: true },
  });

  if (!item || item.watchlist.userId !== dbUser.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { note?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.note !== null && body.note !== undefined) {
    if (typeof body.note !== "string" || body.note.length > 500) {
      return NextResponse.json(
        { error: "Note must be a string of 500 characters or less" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.watchlistItem.update({
    where: { id },
    data: { note: body.note ?? null },
    include: { symbol: true },
  });

  return NextResponse.json({
    item: {
      id: updated.id,
      note: updated.note,
      symbol: {
        ticker: updated.symbol.ticker,
        name: updated.symbol.name,
        exchange: updated.symbol.exchange,
      },
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbUser = await getDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const item = await prisma.watchlistItem.findUnique({
    where: { id },
    include: { watchlist: true },
  });

  if (!item || item.watchlist.userId !== dbUser.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.watchlistItem.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
