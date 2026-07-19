/**
 * Linux.do Connect (OAuth 2.0 / OIDC) 配置
 * 发现文档：https://connect.linux.do/.well-known/openid-configuration
 * 申请应用：https://connect.linux.do/
 */
export const LINUXDO = {
  authorizeUrl: "https://connect.linux.do/oauth2/authorize",
  // 服务端换 token / 拉用户信息：优先备用域名，规避部分网络环境对 connect.linux.do 的限制
  tokenUrl:
    process.env.LINUXDO_TOKEN_URL ??
    "https://connect.linuxdo.org/oauth2/token",
  userInfoUrl:
    process.env.LINUXDO_USERINFO_URL ??
    "https://connect.linuxdo.org/api/user",
  // 浏览器跳转授权仍用主域名
  publicAuthorizeUrl:
    process.env.LINUXDO_AUTHORIZE_URL ??
    "https://connect.linux.do/oauth2/authorize",
  scope: process.env.LINUXDO_SCOPE ?? "openid profile email",
} as const;

export function getClientId(): string {
  const id = process.env.LINUXDO_CLIENT_ID;
  if (!id) throw new Error("未配置 LINUXDO_CLIENT_ID");
  return id;
}

export function getClientSecret(): string {
  const secret = process.env.LINUXDO_CLIENT_SECRET;
  if (!secret) throw new Error("未配置 LINUXDO_CLIENT_SECRET");
  return secret;
}

export function getSessionSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("未配置 AUTH_SECRET（至少 16 字符的随机串）");
  }
  return secret;
}

/** 应用对外可访问的绝对 URL（用于拼 redirect_uri） */
export function getAppUrl(reqUrl?: string): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_APP_URL)
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (reqUrl) {
    try {
      const u = new URL(reqUrl);
      return `${u.protocol}//${u.host}`;
    } catch {
      /* fallthrough */
    }
  }
  return "http://localhost:3000";
}

export function getRedirectUri(reqUrl?: string): string {
  return `${getAppUrl(reqUrl)}/api/auth/callback`;
}

/** 会话 Cookie 名 */
export const SESSION_COOKIE = "steppix_session";
export const OAUTH_STATE_COOKIE = "steppix_oauth_state";

/** 会话有效期（默认 7 天） */
export const SESSION_MAX_AGE_SEC = Number(process.env.SESSION_MAX_AGE_SEC) || 7 * 24 * 60 * 60;

/** 可选：最低信任等级，未达到则拒绝登录 */
export function getMinTrustLevel(): number | null {
  const v = process.env.LINUXDO_MIN_TRUST_LEVEL;
  if (v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
