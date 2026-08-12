import { NextRequest, NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  if (!email) {
    return NextResponse.json({ error: "请输入邮箱" }, { status: 400 });
  }

  try {
    const result = await sendOtpEmail(email);
    return NextResponse.json(
      { ok: true, cooldownSec: result.cooldownSec },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "发送失败";
    console.error("send otp failed:", message);
    const status = /频繁|格式|仅支持/.test(message) ? 400 : 500;
    return NextResponse.json(
      { error: message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
