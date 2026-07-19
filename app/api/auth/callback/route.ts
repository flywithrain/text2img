import { NextRequest, NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE } from "@/lib/auth/config";
import {
  assertUserAllowed,
  exchangeCode,
  fetchUserInfo,
} from "@/lib/auth/linuxdo";
import { setSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectHome(req: NextRequest, query?: Record<string, string>) {
  const url = new URL("/", req.url);
  if (query) {
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const err = searchParams.get("error");
  const errDesc = searchParams.get("error_description");
  if (err) {
    return redirectHome(req, {
      auth_error: errDesc || err,
    });
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const savedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!code) {
    return redirectHome(req, { auth_error: "缺少授权码 code" });
  }
  if (!state || !savedState || state !== savedState) {
    return redirectHome(req, { auth_error: "state 校验失败，请重试登录" });
  }

  try {
    const token = await exchangeCode(code, req.url);
    const user = await fetchUserInfo(token.access_token);
    assertUserAllowed(user);

    const res = redirectHome(req, { auth: "ok" });
    // 清掉 state
    res.cookies.set(OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    setSessionCookie(res, user);
    return res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "登录回调失败";
    console.error("oauth callback failed:", message);
    return redirectHome(req, { auth_error: message });
  }
}
