import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromRequest, unauthorized } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
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

  const rows = await prisma.generation.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const items = rows.map((r) => ({
    id: r.id,
    mode: r.mode as "generation" | "edit",
    prompt: r.prompt,
    imageUrl: r.imageUrl,
    createdAt: r.createdAt.getTime(),
    seed: r.seed ?? undefined,
    cfgScale: r.cfgScale ?? undefined,
    steps: r.steps ?? undefined,
  }));

  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "no-store" } },
  );
}
