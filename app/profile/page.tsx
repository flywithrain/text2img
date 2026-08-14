﻿"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  Coins,
  Loader2,
  Mail,
  User as UserIcon,
  Wand2,
  History as HistoryIcon,
  Hash,
  CalendarDays,
  LogIn,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth-button";
import type { PublicUser } from "@/lib/user-types";

export default function ProfilePage() {
  const [user, setUser] = useState<PublicUser | null | undefined>(undefined);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const json = await res.json();
      setUser(json.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => void refresh();
    window.addEventListener("PixSpring:user-refresh", handler);
    return () => window.removeEventListener("PixSpring:user-refresh", handler);
  }, [refresh]);

  async function checkIn() {
    setChecking(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/user/checkin", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "签到失败");
      setUser(json.user);
      setMessage(`签到成功！获得 ${json.gained} 积分`);
      window.dispatchEvent(new Event("PixSpring:user-refresh"));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "签到失败");
    } finally {
      setChecking(false);
    }
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const already = user?.lastCheckIn === today;

  return (
    <div className="min-h-screen bg-bg-100">
      {/* 顶部导航 */}
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-black/5 bg-bg-50/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-ink-500 transition hover:text-ink-900"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Link>
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-sky to-brand-meadow">
                <Wand2 className="h-4 w-4 text-white" />
              </span>
              <span className="font-bold">个人中心</span>
            </span>
          </div>
          <AuthButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6">
        {user === undefined ? (
          <div className="h-40 animate-pulse rounded-2xl bg-bg-200" />
        ) : !user ? (
          <GlassCard className="text-center">
            <LogIn className="mx-auto mb-4 h-10 w-10 text-ink-300" />
            <p className="mb-4 text-ink-500">请先登录后查看个人中心</p>
            <Link href="/login?redirect=/profile">
              <Button variant="primary">去登录</Button>
            </Link>
          </GlassCard>
        ) : (
          <div className="space-y-5">
            {/* 个人信息卡片 */}
            <GlassCard>
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-16 w-16 rounded-2xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-sky/15">
                    <UserIcon className="h-8 w-8 text-brand-sky" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-xl font-bold text-ink-900">
                    {user.displayName || user.username}
                  </h1>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email || user.username}
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2">
                  <Coins className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-xs text-ink-400">剩余积分</p>
                    <p className="text-lg font-bold tabular-nums text-amber-600">
                      {user.credits}
                    </p>
                  </div>
                </div>
              </div>

              {/* 注册信息明细 */}
              <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-black/5 pt-5 sm:grid-cols-2">
                <div className="flex items-center gap-2.5 text-sm">
                  <Hash className="h-4 w-4 shrink-0 text-ink-300" />
                  <dt className="text-ink-400">用户 ID</dt>
                  <dd className="truncate font-mono text-xs text-ink-700">{user.id}</dd>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <UserIcon className="h-4 w-4 shrink-0 text-ink-300" />
                  <dt className="text-ink-400">用户名</dt>
                  <dd className="text-ink-900">{user.username}</dd>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail className="h-4 w-4 shrink-0 text-ink-300" />
                  <dt className="text-ink-400">邮箱</dt>
                  <dd className="text-ink-900">{user.email || "—"}</dd>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <CalendarDays className="h-4 w-4 shrink-0 text-ink-300" />
                  <dt className="text-ink-400">注册时间</dt>
                  <dd className="text-ink-900">
                    {new Date(user.createdAt).toLocaleString("zh-CN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              </dl>
            </GlassCard>

            {/* 签到卡片 */}
            <GlassCard>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                    <CalendarCheck className="h-4 w-4 text-brand-sky" />
                    每日签到
                  </h2>
                  <p className="mt-1 text-sm text-ink-500">
                    每日签到可随机获得 10–20 积分，每次生图消耗 1 积分。
                  </p>
                  {user.lastCheckIn ? (
                    <p className="mt-1 text-xs text-ink-400">
                      上次签到：{user.lastCheckIn}
                    </p>
                  ) : null}
                </div>
                <Button
                  variant="primary"
                  disabled={already || checking}
                  onClick={checkIn}
                  className="sm:w-auto"
                >
                  {checking ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> 签到中…</>
                  ) : already ? (
                    <><CalendarCheck className="h-4 w-4" /> 今日已签到</>
                  ) : (
                    <><CalendarCheck className="h-4 w-4" /> 立即签到</>
                  )}
                </Button>
              </div>
              {message ? (
                <p className="mt-3 text-sm text-emerald-600">{message}</p>
              ) : null}
              {error ? (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              ) : null}
            </GlassCard>

            {/* 快捷入口 */}
            <Link href="/history" className="block">
              <GlassCard className="transition hover:border-brand-sky/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HistoryIcon className="h-5 w-5 text-brand-sky" />
                    <div>
                      <p className="text-sm font-semibold text-ink-900">生图历史</p>
                      <p className="text-xs text-ink-400">查看全部历史作品并下载</p>
                    </div>
                  </div>
                  <span className="text-sm text-ink-400">→</span>
                </div>
              </GlassCard>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
