import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/password";
import { getUserByUsername, toPublicUser } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password) {
    return NextResponse.json(
      { error: "请输入用户名和密码" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const user = await getUserByUsername(username);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "用户名或密码错误" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const res = NextResponse.json(
    { ok: true, user: toPublicUser(user) },
    { headers: { "Cache-Control": "no-store" } },
  );
  setSessionCookie(res, user.id);
  return res;
}
