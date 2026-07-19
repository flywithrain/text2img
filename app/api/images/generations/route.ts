import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/stepfun";
import { STEP_MODEL } from "@/lib/types";
import {
  getSessionUserFromRequest,
  unauthorized,
} from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export async function POST(req: NextRequest) {
  const user = getSessionUserFromRequest(req);
  if (!user) return unauthorized();

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

  const payload = {
    model: STEP_MODEL,
    prompt,
    response_format: "b64_json" as const,
    cfg_scale:
      body.cfg_scale !== undefined ? clamp(Number(body.cfg_scale), 0, 20) : undefined,
    steps:
      body.steps !== undefined ? Math.round(clamp(Number(body.steps), 1, 50)) : undefined,
    seed: body.seed !== undefined ? Math.round(Number(body.seed)) : undefined,
    text_mode: body.text_mode === true || body.text_mode === "true",
  };

  try {
    const b64 = await generateImage(payload);
    return NextResponse.json(
      { b64_json: b64 },
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
