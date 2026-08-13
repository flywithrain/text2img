import { NextRequest, NextResponse } from "next/server";
import { editImage } from "@/lib/stepfun";
import {
  getSessionUserIdFromRequest,
  insufficientCredits,
  unauthorized,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { uploadImage, deleteImage, MAX_HISTORY } from "@/lib/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getNum(form: FormData, key: string): number | undefined {
  const v = form.get(key);
  if (v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

export async function POST(req: NextRequest) {
  const userId = getSessionUserIdFromRequest(req);
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return unauthorized("会话已失效，请重新登录");
  if (user.credits <= 0) return insufficientCredits();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "请求体解析失败（应为 multipart/form-data）" },
      { status: 400 },
    );
  }

  const prompt = (form.get("prompt") as string | null)?.trim();
  const image = form.get("image") as File | null;

  if (!prompt) {
    return NextResponse.json({ error: "prompt 不能为空" }, { status: 400 });
  }
  if (!image || image.size === 0) {
    return NextResponse.json({ error: "请上传参考图" }, { status: 400 });
  }

  const cfgScale = getNum(form, "cfg_scale");
  const steps = getNum(form, "steps");
  const seed = getNum(form, "seed");
  const negativePrompt =
    (form.get("negative_prompt") as string | null)?.trim().slice(0, 512) || undefined;

  try {
    const b64 = await editImage({
      prompt,
      image,
      cfg_scale: cfgScale,
      steps: steps !== undefined ? Math.round(steps) : undefined,
      seed: seed !== undefined ? Math.round(seed) : undefined,
      text_mode: form.get("text_mode") === "true" || form.get("text_mode") === "on",
      negative_prompt: negativePrompt,
    });

    const imageUrl = await uploadImage(
      b64,
      `edit/${userId}/${Date.now()}.png`,
    );

    const [gen, updated] = await prisma.$transaction([
      prisma.generation.create({
        data: {
          userId,
          mode: "edit",
          prompt,
          imageUrl,
          seed: seed !== undefined ? Math.round(seed) : null,
          cfgScale: cfgScale ?? null,
          steps: steps !== undefined ? Math.round(steps) : null,
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
    console.error("edit failed:", e?.message);
    const status = /鉴权失败/.test(e?.message ?? "") ? 401 : 502;
    return NextResponse.json(
      { error: e?.message ?? "编辑失败" },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
