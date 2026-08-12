/** 业务常量：积分 / 签到 / OTP */
export const SIGNUP_BONUS_CREDITS = Number(process.env.SIGNUP_BONUS_CREDITS) || 20;
export const CHECKIN_MIN = Number(process.env.CHECKIN_MIN_CREDITS) || 10;
export const CHECKIN_MAX = Number(process.env.CHECKIN_MAX_CREDITS) || 20;
export const OTP_TTL_MS = Number(process.env.OTP_TTL_MS) || 10 * 60 * 1000;
export const OTP_COOLDOWN_MS = Number(process.env.OTP_COOLDOWN_MS) || 60 * 1000;

/** 上海时区 YYYY-MM-DD */
export function todayInShanghai(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function randomCheckInCredits(): number {
  const min = Math.min(CHECKIN_MIN, CHECKIN_MAX);
  const max = Math.max(CHECKIN_MIN, CHECKIN_MAX);
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
