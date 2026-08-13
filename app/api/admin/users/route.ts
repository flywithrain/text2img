import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromRequest, unauthorized } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getSessionUserIdFromRequest(req);
  if (!userId) return unauthorized();

  const admin = await prisma.user.findUnique({ where: { id: userId } });
  if (!admin?.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      credits: true,
      isAdmin: true,
      lastCheckIn: true,
      createdAt: true,
      _count: { select: { generations: true } },
    },
  });

  const items = users.map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    credits: u.credits,
    isAdmin: u.isAdmin,
    lastCheckIn: u.lastCheckIn,
    createdAt: u.createdAt.toISOString(),
    generationCount: u._count.generations,
  }));

  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "no-store" } },
  );
}
