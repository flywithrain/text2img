import { Resend } from "resend";
import { prisma } from "@/lib/db";
import {
  generateOtpCode,
  normalizeEmail,
  OTP_COOLDOWN_MS,
  OTP_TTL_MS,
} from "@/lib/credits";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.SMTP_FROM ?? "onboarding@resend.dev";

export async function sendOtpEmail(rawEmail: string): Promise<{ ok: true; cooldownSec: number }> {
  const email = normalizeEmail(rawEmail);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("邮箱格式不正确");
  }

  const recent = await prisma.otpCode.findFirst({
    where: { email, used: false },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    const elapsed = Date.now() - recent.createdAt.getTime();
    if (elapsed < OTP_COOLDOWN_MS) {
      const wait = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
      throw new Error(`发送过于频繁，请 ${wait} 秒后再试`);
    }
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  const ttlMin = Math.ceil(OTP_TTL_MS / 60000);

  // 开发模式：不发真邮件，打印验证码
  if (process.env.OTP_DEV_MODE === "1" || process.env.OTP_DEV_MODE === "true") {
    await prisma.otpCode.create({ data: { email, code, expiresAt } });
    console.log(`[OTP_DEV] ${email} => ${code}`);
    return { ok: true, cooldownSec: Math.ceil(OTP_COOLDOWN_MS / 1000) };
  }

  const { error } = await resend.emails.send({
    from: `StepPix <${FROM}>`,
    to: email,
    subject: "StepPix 注册验证码",
    text: `您的注册验证码是：${code}\n\n${ttlMin} 分钟内有效，请勿泄露给他人。`,
    html: `<p>您的注册验证码是：</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>${ttlMin} 分钟内有效，请勿泄露给他人。</p>`,
  });

  if (error) {
    throw new Error(`邮件发送失败：${error.message}`);
  }

  await prisma.otpCode.create({ data: { email, code, expiresAt } });
  return { ok: true, cooldownSec: Math.ceil(OTP_COOLDOWN_MS / 1000) };
}

export async function verifyOtpCode(rawEmail: string, code: string): Promise<string> {
  const email = normalizeEmail(rawEmail);
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    throw new Error("验证码格式不正确");
  }

  const record = await prisma.otpCode.findFirst({
    where: {
      email,
      code: trimmed,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new Error("验证码无效或已过期");
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { used: true },
  });

  return email;
}
