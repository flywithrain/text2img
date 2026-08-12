import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SIGNUP_BONUS_CREDITS } from "@/lib/credits";
import type { PublicUser } from "@/lib/user-types";

export type { PublicUser };

export function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    provider: u.provider,
    email: u.email,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    trustLevel: null,
    credits: u.credits,
    lastCheckIn: u.lastCheckIn,
    createdAt: u.createdAt.toISOString(),
  };
}

/** 邮箱验证码注册新用户，新用户送注册积分 */
export async function registerUser(params: {
  username: string;
  email: string;
  passwordHash: string;
}): Promise<User> {
  const { username, email, passwordHash } = params;
  const providerKey = `email:${email}`;
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    if (existing.username === username) throw new Error("用户名已被占用");
    throw new Error("该邮箱已被注册");
  }
  return prisma.user.create({
    data: {
      provider: "email",
      providerKey,
      username,
      email,
      passwordHash,
      displayName: username,
      credits: SIGNUP_BONUS_CREDITS,
    },
  });
}

/** 按用户名查用户（登录用） */
export async function getUserByUsername(username: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { username } });
}

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}
