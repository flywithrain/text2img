export function getSessionSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("未配置 AUTH_SECRET（至少 16 字符的随机串）");
  }
  return secret;
}

/** 会话 Cookie 名 */
export const SESSION_COOKIE = "PixSpring_session";

/** 会话有效期（默认 7 天） */
export const SESSION_MAX_AGE_SEC = Number(process.env.SESSION_MAX_AGE_SEC) || 7 * 24 * 60 * 60;
