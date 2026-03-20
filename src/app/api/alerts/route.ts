import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const dbUser = await getDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await prisma.alert.findMany({
    where: { userId: dbUser.id },
    include: { symbol: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    alerts: alerts.map((alert) => ({
      id: alert.id,
      direction: alert.direction,
      threshold: alert.threshold,
      status: alert.status,
      triggeredAt: alert.triggeredAt,
      triggeredPrice: alert.triggeredPrice,
      symbol: {
        id: alert.symbol.id,
        ticker: alert.symbol.ticker,
        name: alert.symbol.name,
        exchange: alert.symbol.exchange,
      },
    })),
  });
}

export async function POST(request: NextRequest) {
  const dbUser = await getDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { symbolId?: string; direction?: string; threshold?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { symbolId, direction, threshold } = body;

  if (!symbolId || !direction || threshold === undefined || threshold === null) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (direction !== "above" && direction !== "below") {
    return NextResponse.json(
      { error: "Direction must be 'above' or 'below'" },
      { status: 400 }
    );
  }

  if (typeof threshold !== "number" || threshold <= 0) {
    return NextResponse.json(
      { error: "Threshold must be a positive number" },
      { status: 400 }
    );
  }

  const symbol = await prisma.symbol.findUnique({ where: { id: symbolId } });
  if (!symbol) {
    return NextResponse.json({ error: "Symbol not found" }, { status: 404 });
  }

  const alert = await prisma.alert.create({
    data: {
      userId: dbUser.id,
      symbolId,
      direction,
      threshold,
    },
    include: { symbol: true },
  });

  return NextResponse.json(
    {
      alert: {
        id: alert.id,
        direction: alert.direction,
        threshold: alert.threshold,
        status: alert.status,
        triggeredAt: alert.triggeredAt,
        triggeredPrice: alert.triggeredPrice,
        symbol: {
          id: alert.symbol.id,
          ticker: alert.symbol.ticker,
          name: alert.symbol.name,
          exchange: alert.symbol.exchange,
        },
      },
    },
    { status: 201 }
  );
}
