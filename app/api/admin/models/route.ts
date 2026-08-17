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

/** 管理员：模型列表（含掩码密钥） */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "无权限" }, { status: 403 });

  const rows = await prisma.imageModel.findMany({
    orderBy: [{ createdAt: "desc" }],
  });
  return NextResponse.json(
    { items: rows.map(toAdminView) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** 管理员：新增模型 */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req)))
    return NextResponse.json({ error: "无权限" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const { data, error } = parseModelInput(body);
  if (!data) return NextResponse.json({ error }, { status: 400 });
  if (!data.apiKey)
    return NextResponse.json({ error: "API Key 不能为空" }, { status: 400 });

  const exists = await prisma.imageModel.findUnique({ where: { name: data.name } });
  if (exists)
    return NextResponse.json({ error: "模型名称已存在" }, { status: 409 });

  const row = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.imageModel.updateMany({ data: { isDefault: false } });
    }
    return tx.imageModel.create({
      data: {
        name: data.name,
        provider: data.provider,
        model: data.model,
        baseUrl: data.baseUrl,
        apiKey: data.apiKey!,
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
