import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getSessionUserIdFromRequest,
  unauthorized,
} from "@/lib/auth/session";
import { parseModelInput, toAdminView } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(req: NextRequest): Promise<string | null> {
  const userId = getSessionUserIdFromRequest(req);
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.isAdmin ? userId : null;
}

/** 管理员：更新模型（apiKey 留空则保留原值） */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin(req))) {
    if (!getSessionUserIdFromRequest(req)) return unauthorized();
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const { data, error } = parseModelInput(body);
  if (!data) return NextResponse.json({ error }, { status: 400 });

  const exists = await prisma.imageModel.findUnique({ where: { id } });
  if (!exists)
    return NextResponse.json({ error: "模型不存在" }, { status: 404 });

  const nameConflict = await prisma.imageModel.findUnique({
    where: { name: data.name },
  });
  if (nameConflict && nameConflict.id !== id)
    return NextResponse.json({ error: "模型名称已存在" }, { status: 409 });

  const row = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.imageModel.updateMany({ data: { isDefault: false } });
    }
    return tx.imageModel.update({
      where: { id },
      data: {
        name: data.name,
        provider: data.provider,
        model: data.model,
        baseUrl: data.baseUrl,
        ...(data.apiKey ? { apiKey: data.apiKey } : {}),
        enabled: data.enabled,
        isDefault: data.isDefault,
      },
    });
  });

  return NextResponse.json(
    { ok: true, item: toAdminView(row) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** 管理员：删除模型 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin(req))) {
    if (!getSessionUserIdFromRequest(req)) return unauthorized();
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.imageModel.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "模型不存在" }, { status: 404 });
  }
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
