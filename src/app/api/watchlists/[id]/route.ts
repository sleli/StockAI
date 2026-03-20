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

  const watchlist = await prisma.watchlist.findUnique({ where: { id } });
  if (!watchlist || watchlist.userId !== dbUser.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.name || !body.name.trim() || body.name.length > 50) {
    return NextResponse.json(
      { error: "Name is required and must be 50 characters or less" },
      { status: 400 }
    );
  }

  const updated = await prisma.watchlist.update({
    where: { id },
    data: { name: body.name.trim() },
  });

  return NextResponse.json({
    watchlist: { id: updated.id, name: updated.name },
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

  const watchlist = await prisma.watchlist.findUnique({ where: { id } });
  if (!watchlist || watchlist.userId !== dbUser.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.watchlist.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
