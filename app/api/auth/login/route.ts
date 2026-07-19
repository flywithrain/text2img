import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE } from "@/lib/auth/config";
import { buildAuthorizeUrl } from "@/lib/auth/linuxdo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const state = randomBytes(24).toString("hex");
    const url = buildAuthorizeUrl({ state, reqUrl: req.url });

    const res = NextResponse.redirect(url);
    res.cookies.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 分钟内完成授权
    });
    return res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "启动登录失败";
    console.error("login start failed:", message);
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(message)}`, req.url),
    );
  }
}
