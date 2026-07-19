import { NextRequest, NextResponse } from "next/server";
import { editImage } from "@/lib/stepfun";
import {
  getSessionUserFromRequest,
  unauthorized,
} from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getNum(form: FormData, key: string): number | undefined {
  const v = form.get(key);
  if (v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

export async function POST(req: NextRequest) {
  const user = getSessionUserFromRequest(req);
  if (!user) return unauthorized();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "请求体解析失败（应为 multipart/form-data）" }, { status: 400 });
  }

  const prompt = (form.get("prompt") as string | null)?.trim();
  const image = form.get("image") as File | null;

  if (!prompt) {
    return NextResponse.json({ error: "prompt 不能为空" }, { status: 400 });
  }
  if (!image || image.size === 0) {
    return NextResponse.json({ error: "请上传参考图" }, { status: 400 });
  }

  try {
    const b64 = await editImage({
      prompt,
      image,
      cfg_scale: getNum(form, "cfg_scale"),
      steps: getNum(form, "steps"),
      seed: getNum(form, "seed"),
      text_mode: form.get("text_mode") === "true" || form.get("text_mode") === "on",
    });
    return NextResponse.json(
      { b64_json: b64 },
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
