import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  const dbUser = await getDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ticker?: string; name?: string; exchange?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { ticker, name, exchange } = body;

  if (!ticker || !name || !exchange) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  let watchlist = await prisma.watchlist.findFirst({
    where: { userId: dbUser.id },
  });

  if (!watchlist) {
    watchlist = await prisma.watchlist.create({
      data: {
        name: "La mia Watchlist",
        userId: dbUser.id,
      },
    });
  }

  const symbol = await prisma.symbol.upsert({
    where: { ticker },
    update: { name, exchange },
    create: { ticker, name, exchange },
  });

  try {
    const item = await prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist.id,
        symbolId: symbol.id,
      },
      include: { symbol: true },
    });

    return NextResponse.json(
      {
        item: {
          id: item.id,
          symbol: {
            ticker: item.symbol.ticker,
            name: item.symbol.name,
            exchange: item.symbol.exchange,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Titolo già in watchlist" },
        { status: 409 }
      );
    }
    throw error;
  }
}
