import { NextRequest, NextResponse } from "next/server";
import {
  getSessionUserIdFromRequest,
  unauthorized,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { deleteImage } from "@/lib/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const myId = getSessionUserIdFromRequest(req);
  if (!myId) return unauthorized();

  const { searchParams } = req.nextUrl;
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 100));
  const cursor = searchParams.get("cursor");
  const targetUserId = searchParams.get("userId");

  let userId = myId;
  if (targetUserId && targetUserId !== myId) {
    const me = await prisma.user.findUnique({ where: { id: myId } });
    if (!me?.isAdmin) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    userId = targetUserId;
  }

  const rows = await prisma.generation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
  });

  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, limit) : rows).map((r) => ({
    id: r.id,
    mode: r.mode as "generation" | "edit",
    prompt: r.prompt,
    imageUrl: r.imageUrl,
    modelName: r.modelName ?? undefined,
    createdAt: r.createdAt.getTime(),
    seed: r.seed ?? undefined,
    cfgScale: r.cfgScale ?? undefined,
    steps: r.steps ?? undefined,
  }));

  return NextResponse.json(
    {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(req: NextRequest) {
  const myId = getSessionUserIdFromRequest(req);
  if (!myId) return unauthorized();

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  }

  const me = await prisma.user.findUnique({ where: { id: myId } });
  const where = me?.isAdmin ? { id } : { id, userId: myId };
  const row = await prisma.generation.findFirst({ where });
  if (!row) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  await deleteImage(row.imageUrl);
  await prisma.generation.delete({ where: { id } });
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
