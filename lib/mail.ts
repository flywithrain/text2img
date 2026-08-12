import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import {
  generateOtpCode,
  normalizeEmail,
  OTP_COOLDOWN_MS,
  OTP_TTL_MS,
} from "@/lib/credits";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST ?? "smtp.qq.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;
  if (!user || !pass) {
    throw new Error("未配置 SMTP_USER / SMTP_PASS（QQ 邮箱授权码）");
  }
  return { host, port, user, pass, from: from! };
}

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

  // 开发模式：不发真邮件，打印验证码
  if (process.env.OTP_DEV_MODE === "1" || process.env.OTP_DEV_MODE === "true") {
    await prisma.otpCode.create({ data: { email, code, expiresAt } });
    console.log(`[OTP_DEV] ${email} => ${code}`);
    return { ok: true, cooldownSec: Math.ceil(OTP_COOLDOWN_MS / 1000) };
  }

  const smtp = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  await transporter.sendMail({
    from: `"StepPix" <${smtp.from}>`,
    to: email,
    subject: "StepPix 登录验证码",
    text: `您的登录验证码是：${code}\n\n${Math.ceil(OTP_TTL_MS / 60000)} 分钟内有效，请勿泄露给他人。`,
    html: `<p>您的登录验证码是：</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>${Math.ceil(OTP_TTL_MS / 60000)} 分钟内有效，请勿泄露给他人。</p>`,
  });

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
