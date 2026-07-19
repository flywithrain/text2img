import {
  getClientId,
  getClientSecret,
  getMinTrustLevel,
  getRedirectUri,
  LINUXDO,
} from "./config";
import type { LinuxDoUser } from "./types";

export function buildAuthorizeUrl(params: {
  state: string;
  reqUrl?: string;
}): string {
  const url = new URL(LINUXDO.publicAuthorizeUrl);
  url.searchParams.set("client_id", getClientId());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", getRedirectUri(params.reqUrl));
  url.searchParams.set("state", params.state);
  url.searchParams.set("scope", LINUXDO.scope);
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

export async function exchangeCode(
  code: string,
  reqUrl?: string,
): Promise<TokenResponse> {
  const redirectUri = getRedirectUri(reqUrl);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: getClientId(),
    client_secret: getClientSecret(),
  });

  const res = await fetch(LINUXDO.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`换取 token 失败 ${res.status}: ${text.slice(0, 300)}`);
  }

  let json: TokenResponse;
  try {
    json = JSON.parse(text) as TokenResponse;
  } catch {
    throw new Error("token 响应不是合法 JSON");
  }
  if (!json.access_token) throw new Error("token 响应缺少 access_token");
  return json;
}

/** 将 /api/user 或 OIDC claims 归一化为会话用户 */
export function normalizeUser(raw: Record<string, unknown>): LinuxDoUser {
  const id = (raw.id ?? raw.sub ?? raw.user_id) as number | string | undefined;
  const username = String(
    raw.username ?? raw.login ?? raw.name ?? raw.preferred_username ?? "",
  ).trim();
  if (id === undefined || id === null || !username) {
    throw new Error("用户信息不完整（缺少 id / username）");
  }

  let avatarUrl: string | undefined;
  if (typeof raw.avatar_url === "string" && raw.avatar_url) {
    avatarUrl = raw.avatar_url;
  } else if (typeof raw.avatar_template === "string" && raw.avatar_template) {
    // Discourse 风格：/user_avatar/.../{size}/...
    avatarUrl = raw.avatar_template.replace(/\{size\}/g, "120");
    if (avatarUrl.startsWith("//")) avatarUrl = `https:${avatarUrl}`;
    else if (avatarUrl.startsWith("/"))
      avatarUrl = `https://linux.do${avatarUrl}`;
  }

  const trustLevel =
    typeof raw.trust_level === "number"
      ? raw.trust_level
      : typeof raw.trust_level === "string"
        ? Number(raw.trust_level)
        : undefined;

  return {
    id,
    username,
    name: typeof raw.name === "string" ? raw.name : undefined,
    email: typeof raw.email === "string" ? raw.email : undefined,
    avatarUrl,
    trustLevel: Number.isFinite(trustLevel) ? trustLevel : undefined,
    active: typeof raw.active === "boolean" ? raw.active : undefined,
  };
}

export async function fetchUserInfo(accessToken: string): Promise<LinuxDoUser> {
  const res = await fetch(LINUXDO.userInfoUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`获取用户信息失败 ${res.status}: ${text.slice(0, 300)}`);
  }

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("用户信息响应不是合法 JSON");
  }

  // 部分实现把用户包在 user 字段里
  if (raw.user && typeof raw.user === "object") {
    raw = raw.user as Record<string, unknown>;
  }

  return normalizeUser(raw);
}

/** 按环境变量校验是否允许登录 */
export function assertUserAllowed(user: LinuxDoUser): void {
  if (user.active === false) {
    throw new Error("账号未激活，无法登录");
  }
  const min = getMinTrustLevel();
  if (min !== null && (user.trustLevel ?? 0) < min) {
    throw new Error(`信任等级不足（需要 ≥ ${min}，当前 ${user.trustLevel ?? 0}）`);
  }
}
