import { NextRequest, NextResponse } from "next/server";
import { generateImage, resolveModel } from "@/lib/image-api";
import {
  getSessionUserIdFromRequest,
  insufficientCredits,
  unauthorized,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { uploadImage, deleteImage, MAX_HISTORY } from "@/lib/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * size 统一按「宽x高」传入；stepfun 接口实际按「高x宽」解析，需要交换，
 * openai 兼容接口原生就是「宽x高」，gemini 不支持 size。
 */
function sizeForProvider(
  size: string | undefined,
  provider: string,
): string | undefined {
  if (!size || provider === "gemini") return undefined;
  if (provider !== "stepfun") return size;
  const m = /^(\d+)x(\d+)$/.exec(size);
  return m ? `${m[2]}x${m[1]}` : size;
}

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
    body.cfg_scale !== undefined ? clamp(Number(body.cfg_scale), 1, 10) : undefined;
  const steps =
    body.steps !== undefined ? Math.round(clamp(Number(body.steps), 1, 50)) : undefined;
  const seed = body.seed !== undefined ? Math.round(Number(body.seed)) : undefined;
  const size =
    typeof body.size === "string" && /^\d+x\d+$/.test(body.size)
      ? body.size
      : undefined;
  const negativePrompt =
    typeof body.negative_prompt === "string"
      ? body.negative_prompt.trim().slice(0, 512)
      : undefined;

  const modelId =
    typeof body.modelId === "string" && body.modelId ? body.modelId : undefined;

  try {
    const model = await resolveModel(modelId);

    const payload = {
      model: model.model,
      prompt,
      response_format: "b64_json" as const,
      cfg_scale: model.provider === "stepfun" ? cfgScale : undefined,
      steps: model.provider === "stepfun" ? steps : undefined,
      seed: model.provider === "stepfun" ? seed : undefined,
      size: sizeForProvider(size, model.provider),
      text_mode:
        model.provider === "stepfun"
          ? body.text_mode === true || body.text_mode === "true"
          : undefined,
      negative_prompt: model.provider === "stepfun" ? negativePrompt : undefined,
    };

    const b64 = await generateImage(payload, model);

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
          modelName: model.name,
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
        modelName: model.name,
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
