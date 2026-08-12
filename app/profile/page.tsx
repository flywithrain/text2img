"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  Coins,
  Loader2,
  Mail,
  Shield,
  User as UserIcon,
  Wand2,
  Compass,
  Braces,
  Calculator,
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

  async function checkIn() {
    setChecking(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/user/checkin", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "签到失败");
      setUser(json.user);
      setMessage(`签到成功！获得 ${json.gained} 次生图机会`);
      window.dispatchEvent(new Event("steppix:user-refresh"));
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
    <div className="min-h-screen">
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-black/5 bg-bg-50/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-ink-500 transition hover:text-ink-900"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Link>
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo to-brand-purple">
                <Wand2 className="h-4 w-4 text-white" />
              </span>
              <span className="font-bold">个人资料</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center rounded-xl border border-black/5 bg-bg-100 p-1 lg:inline-flex">
              <a
                href="https://navigation.oneget.space"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-500 transition-all duration-200 hover:text-ink-900"
              >
                <Compass className="h-4 w-4" />
                <span>资源导航</span>
              </a>
              <a
                href="https://json-tool.oneget.space"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-500 transition-all duration-200 hover:text-ink-900"
              >
                <Braces className="h-4 w-4" />
                <span>开发工具</span>
              </a>
              <a
                href="https://calculator-tool.oneget.space"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-500 transition-all duration-200 hover:text-ink-900"
              >
                <Calculator className="h-4 w-4" />
                <span>计算器大全</span>
              </a>
            </div>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-24 sm:px-6">
        {user === undefined ? (
          <div className="h-40 animate-pulse rounded-2xl bg-bg-100" />
        ) : !user ? (
          <GlassCard className="text-center">
            <p className="mb-4 text-ink-500">请先登录后查看个人资料</p>
            <Link href="/">
              <Button variant="primary">返回首页登录</Button>
            </Link>
          </GlassCard>
        ) : (
          <div className="space-y-5">
            <GlassCard>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-16 w-16 rounded-2xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-violet/25">
                    <UserIcon className="h-8 w-8 text-brand-violet" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-xl font-bold text-ink-900">
                    {user.displayName || user.username}
                  </h1>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5" />
                      {user.provider === "linuxdo" ? "Linux.do" : "邮箱注册"}
                    </span>
                    {user.email ? (
                      <span className="inline-flex items-center gap-1 truncate">
                        <Mail className="h-3.5 w-3.5" />
                        {user.email}
                      </span>
                    ) : null}
                    {user.trustLevel != null ? (
                      <span>信任等级 TL{user.trustLevel}</span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-ink-300">
                    注册于 {new Date(user.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                  <Coins className="h-4 w-4 text-amber-600" />
                  生图次数
                </h2>
                <span className="text-2xl font-bold tabular-nums text-amber-600">
                  {user.credits}
                </span>
              </div>
              <p className="mb-4 text-sm text-ink-500">
                每次文生图或图像编辑消耗 1 次。新用户注册赠送 20 次；每日签到可随机获得 10–20 次。
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  variant="primary"
                  disabled={already || checking}
                  onClick={checkIn}
                  className="sm:w-auto"
                >
                  {checking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> 签到中…
                    </>
                  ) : already ? (
                    <>
                      <CalendarCheck className="h-4 w-4" /> 今日已签到
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="h-4 w-4" /> 每日签到
                    </>
                  )}
                </Button>
                {user.lastCheckIn ? (
                  <span className="text-xs text-ink-400">
                    上次签到：{user.lastCheckIn}
                  </span>
                ) : null}
              </div>

              {message ? (
                <p className="mt-3 text-sm text-emerald-600">{message}</p>
              ) : null}
              {error ? (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              ) : null}
            </GlassCard>

            <GlassCard>
              <h2 className="mb-2 text-sm font-semibold text-ink-900">账号信息</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-500">用户 ID</dt>
                  <dd className="truncate font-mono text-xs text-ink-900">
                    {user.id}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-500">用户名</dt>
                  <dd className="text-ink-900">{user.username}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-500">登录方式</dt>
                  <dd className="text-ink-900">
                    {user.provider === "linuxdo" ? "Linux.do OAuth" : "邮箱 + 密码"}
                  </dd>
                </div>
              </dl>
            </GlassCard>
          </div>
        )}
      </main>
    </div>
  );
}
