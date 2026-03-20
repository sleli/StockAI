import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const watchlistId = request.nextUrl.searchParams.get("id");

    let watchlist = await prisma.watchlist.findFirst({
      where: {
        userId: dbUser.id,
        ...(watchlistId ? { id: watchlistId } : {}),
      },
      include: {
        items: {
          include: { symbol: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!watchlist) {
      watchlist = await prisma.watchlist.create({
        data: {
          name: "La mia Watchlist",
          userId: dbUser.id,
        },
        include: {
          items: {
            include: { symbol: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      });
    }

    return NextResponse.json({
      watchlist: {
        id: watchlist.id,
        name: watchlist.name,
        items: watchlist.items.map((item) => ({
          id: item.id,
          sortOrder: item.sortOrder,
          note: item.note,
          symbol: {
            ticker: item.symbol.ticker,
            name: item.symbol.name,
            exchange: item.symbol.exchange,
          },
        })),
      },
    });
  } catch (err) {
    console.error("[GET /api/watchlist] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
