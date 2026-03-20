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

  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert || alert.userId !== dbUser.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { status?: string; triggeredPrice?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.status) {
    if (!["active", "disabled", "triggered", "dismissed"].includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }
    updateData.status = body.status;

    if (body.status === "triggered") {
      updateData.triggeredAt = new Date();
      if (body.triggeredPrice !== undefined) {
        updateData.triggeredPrice = body.triggeredPrice;
      }
    }
  }

  const updated = await prisma.alert.update({
    where: { id },
    data: updateData,
    include: { symbol: true },
  });

  return NextResponse.json({
    alert: {
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

  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert || alert.userId !== dbUser.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.alert.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
