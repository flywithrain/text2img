import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/stepfun";
import { STEP_MODEL } from "@/lib/types";
import {
  getSessionUserIdFromRequest,
  insufficientCredits,
  unauthorized,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { uploadImage, deleteImage, MAX_HISTORY } from "@/lib/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export async function POST(req: NextRequest) {
  const userId = getSessionUserIdFromRequest(req);
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return unauthorized("会话已失效，请重新登录");
  if (user.credits <= 0) return insufficientCredits();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "prompt 不能为空" }, { status: 400 });
  }

  const cfgScale =
    body.cfg_scale !== undefined ? clamp(Number(body.cfg_scale), 0, 20) : undefined;
  const steps =
    body.steps !== undefined ? Math.round(clamp(Number(body.steps), 1, 50)) : undefined;
  const seed = body.seed !== undefined ? Math.round(Number(body.seed)) : undefined;

  const payload = {
    model: STEP_MODEL,
    prompt,
    response_format: "b64_json" as const,
    cfg_scale: cfgScale,
    steps,
    seed,
    text_mode: body.text_mode === true || body.text_mode === "true",
  };

  try {
    const b64 = await generateImage(payload);

    const imageUrl = await uploadImage(
      b64,
      `gen/${userId}/${Date.now()}.png`,
    );

    const [gen, updated] = await prisma.$transaction([
      prisma.generation.create({
        data: {
          userId,
          mode: "generation",
          prompt,
          imageUrl,
          seed: seed ?? null,
          cfgScale: cfgScale ?? null,
          steps: steps ?? null,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: 1 } },
      }),
    ]);

    // 超过上限时删除最旧的记录及其 Blob
    const excess = await prisma.generation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: MAX_HISTORY,
      select: { id: true, imageUrl: true },
    });
    if (excess.length > 0) {
      await Promise.all(excess.map((e) => deleteImage(e.imageUrl)));
      await prisma.generation.deleteMany({
        where: { id: { in: excess.map((e) => e.id) } },
      });
    }

    return NextResponse.json(
      {
        b64_json: b64,
        imageUrl,
        id: gen.id,
        createdAt: gen.createdAt.getTime(),
        credits: updated.credits,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e: any) {
    console.error("generate failed:", e?.message);
    const status = /鉴权失败/.test(e?.message ?? "") ? 401 : 502;
    return NextResponse.json(
      { error: e?.message ?? "生成失败" },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
