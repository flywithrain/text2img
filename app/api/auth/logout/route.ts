import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const res = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  clearSessionCookie(res);
  // 兼容表单/链接跳转
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    const redirect = NextResponse.redirect(new URL("/", req.url));
    clearSessionCookie(redirect);
    return redirect;
  }
  return res;
}

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/", req.url));
  clearSessionCookie(res);
  return res;
}
