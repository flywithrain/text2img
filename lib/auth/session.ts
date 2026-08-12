import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  getSessionSecret,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
} from "./config";
import type { SessionPayload, SessionUser } from "./types";
import { getUserById, toPublicUser } from "@/lib/users";
import type { PublicUser } from "@/lib/user-types";

function b64url(buf: Buffer | string): string {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, "utf8");
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

function sign(data: string): string {
  return b64url(createHmac("sha256", getSessionSecret()).update(data).digest());
}

function verify(data: string, sig: string): boolean {
  let expected: string;
  try {
    expected = sign(data);
  } catch {
    return false;
  }
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function encodeSession(userId: string): string {
  const now = Date.now();
  const payload: SessionPayload = {
    user: { id: userId },
    iat: now,
    exp: now + SESSION_MAX_AGE_SEC * 1000,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function decodeSession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig || !verify(body, sig)) return null;
  try {
    const payload = JSON.parse(fromB64url(body).toString("utf8")) as SessionPayload;
    if (!payload?.user?.id) return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SEC,
};

/** 在 Route Handler 中写入会话（存 DB userId） */
export function setSessionCookie(res: NextResponse, userId: string) {
  res.cookies.set(SESSION_COOKIE, encodeSession(userId), cookieOpts);
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOpts, maxAge: 0 });
}

export function getSessionUserIdFromRequest(req: NextRequest): string | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return decodeSession(token)?.user.id ?? null;
}

export function getSessionUserId(): string | null {
  try {
    const jar = cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    return decodeSession(token)?.user.id ?? null;
  } catch {
    return null;
  }
}

/** 未登录时返回 401 JSON */
export function unauthorized(message = "请先登录") {
  return NextResponse.json(
    { error: message, code: "UNAUTHORIZED" },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

export function insufficientCredits() {
  return NextResponse.json(
    { error: "生图次数不足，请先签到获取", code: "NO_CREDITS" },
    { status: 402, headers: { "Cache-Control": "no-store" } },
  );
}

/** 从请求解析完整用户（查库） */
export async function requireUserFromRequest(
  req: NextRequest,
): Promise<{ user: PublicUser } | { response: NextResponse }> {
  const id = getSessionUserIdFromRequest(req);
  if (!id) return { response: unauthorized() };
  const row = await getUserById(id);
  if (!row) return { response: unauthorized("会话已失效，请重新登录") };
  return { user: toPublicUser(row) };
}

export async function getSessionPublicUser(): Promise<PublicUser | null> {
  const id = getSessionUserId();
  if (!id) return null;
  const row = await getUserById(id);
  return row ? toPublicUser(row) : null;
}

// 兼容旧导出名
export type { SessionUser };
