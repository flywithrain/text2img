import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromRequest, unauthorized } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminId = getSessionUserIdFromRequest(req);
  if (!adminId) return unauthorized();

  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin?.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const credits = Number(body.credits);

  if (!Number.isFinite(credits) || credits < 0) {
    return NextResponse.json(
      { error: "积分必须为非负整数" },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { credits: Math.floor(credits) },
    select: { id: true, credits: true },
  });

  return NextResponse.json(
    { ok: true, credits: updated.credits },
    { headers: { "Cache-Control": "no-store" } },
  );
}
