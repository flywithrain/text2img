import { NextRequest, NextResponse } from "next/server";
import {
  getSessionUserIdFromRequest,
  unauthorized,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  randomCheckInCredits,
  todayInShanghai,
} from "@/lib/credits";
import { toPublicUser } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = getSessionUserIdFromRequest(req);
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return unauthorized("会话已失效，请重新登录");

  const today = todayInShanghai();
  if (user.lastCheckIn === today) {
    return NextResponse.json(
      {
        error: "今日已签到",
        code: "ALREADY_CHECKED_IN",
        user: toPublicUser(user),
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const gained = randomCheckInCredits();
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      credits: { increment: gained },
      lastCheckIn: today,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      gained,
      user: toPublicUser(updated),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
