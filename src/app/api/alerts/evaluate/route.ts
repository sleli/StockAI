import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { sendAlertNotification } from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { quotes: Record<string, { price: number }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.quotes || typeof body.quotes !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Get active alerts for this user
  const activeAlerts = await prisma.alert.findMany({
    where: {
      userId: dbUser.id,
      status: "active",
    },
    include: { symbol: true },
  });

  const triggeredAlerts = [];

  for (const alert of activeAlerts) {
    const quote = body.quotes[alert.symbol.ticker];
    if (!quote) continue;

    const shouldTrigger =
      (alert.direction === "above" && quote.price >= alert.threshold) ||
      (alert.direction === "below" && quote.price <= alert.threshold);

    if (shouldTrigger) {
      const updated = await prisma.alert.update({
        where: { id: alert.id },
        data: {
          status: "triggered",
          triggeredAt: new Date(),
          triggeredPrice: quote.price,
        },
        include: { symbol: true },
      });

      triggeredAlerts.push({
        id: updated.id,
        direction: updated.direction,
        threshold: updated.threshold,
        status: updated.status,
        triggeredAt: updated.triggeredAt,
        triggeredPrice: updated.triggeredPrice,
        symbol: {
          id: updated.symbol.id,
          ticker: updated.symbol.ticker,
          name: updated.symbol.name,
          exchange: updated.symbol.exchange,
        },
      });

      // Send email notification (fire-and-forget)
      sendAlertNotification(dbUser.id, updated.id, {
        to: dbUser.email,
        ticker: updated.symbol.ticker,
        symbolName: updated.symbol.name,
        direction: updated.direction,
        threshold: updated.threshold,
        triggeredPrice: quote.price,
        triggeredAt: updated.triggeredAt ?? new Date(),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ triggered: triggeredAlerts });
}
