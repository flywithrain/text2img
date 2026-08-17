import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";
import { toPublicView } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 登录用户获取可用模型列表（不含密钥） */
export async function GET() {
  const userId = getSessionUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "请先登录", code: "UNAUTHORIZED" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const rows = await prisma.imageModel.findMany({
    where: { enabled: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(
    { items: rows.map(toPublicView) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
