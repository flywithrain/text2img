import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import { verifyOtpCode } from "@/lib/mail";
import { hashPassword } from "@/lib/password";
import { registerUser, toPublicUser } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string; email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!username || !password || !email || !code) {
    return NextResponse.json(
      { error: "请完整填写用户名、密码、邮箱和验证码" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (username.length < 2 || username.length > 20) {
    return NextResponse.json(
      { error: "用户名长度需在 2-20 位之间" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (password.length < 6 || password.length > 64) {
    return NextResponse.json(
      { error: "密码长度需在 6-64 位之间" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const normalizedEmail = await verifyOtpCode(email, code);
    const passwordHash = hashPassword(password);
    const user = await registerUser({ username, email: normalizedEmail, passwordHash });
    const res = NextResponse.json(
      { ok: true, user: toPublicUser(user) },
      { headers: { "Cache-Control": "no-store" } },
    );
    setSessionCookie(res, user.id);
    return res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "注册失败";
    console.error("register failed:", message);
    return NextResponse.json(
      { error: message },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
