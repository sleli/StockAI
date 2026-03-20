import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const dbUser = await getDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    emailNotifications: dbUser.emailNotifications,
    refreshInterval: dbUser.refreshInterval,
  });
}

export async function PATCH(request: NextRequest) {
  const dbUser = await getDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { emailNotifications?: boolean; refreshInterval?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data: { emailNotifications?: boolean; refreshInterval?: number } = {};

  if (typeof body.emailNotifications === "boolean") {
    data.emailNotifications = body.emailNotifications;
  }

  if (body.refreshInterval !== undefined) {
    if (
      typeof body.refreshInterval !== "number" ||
      !Number.isInteger(body.refreshInterval) ||
      body.refreshInterval < 15 ||
      body.refreshInterval > 300
    ) {
      return NextResponse.json(
        { error: "refreshInterval must be an integer between 15 and 300" },
        { status: 400 }
      );
    }
    data.refreshInterval = body.refreshInterval;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: dbUser.id },
    data,
    select: { emailNotifications: true, refreshInterval: true },
  });

  return NextResponse.json({
    emailNotifications: updated.emailNotifications,
    refreshInterval: updated.refreshInterval,
  });
}
