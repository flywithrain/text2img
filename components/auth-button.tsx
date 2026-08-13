"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, LogOut, User as UserIcon, ChevronDown, History as HistoryIcon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicUser } from "@/lib/user-types";

export function AuthButton() {
  const [user, setUser] = useState<PublicUser | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // 供页面在积分变化后刷新
  useEffect(() => {
    const handler = () => void refresh();
    window.addEventListener("PixSpring:user-refresh", handler);
    return () => window.removeEventListener("PixSpring:user-refresh", handler);
  }, [refresh]);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setMenuOpen(false);
      window.dispatchEvent(new Event("PixSpring:user-refresh"));
    } finally {
      setBusy(false);
    }
  }

  if (user === undefined) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-xl bg-black/5" aria-hidden />
    );
  }

  if (!user) {
    return (
      <Link href="/login">
        <Button
          variant="outline"
          className="h-9 px-3 text-xs sm:text-sm"
        >
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">登录</span>
        </Button>
      </Link>
    );
  }

  const label = user.displayName || user.username;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="flex h-9 max-w-[11rem] items-center gap-2 rounded-xl border border-black/10 bg-white px-2.5 transition hover:bg-bg-200 sm:max-w-[14rem]"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="h-5 w-5 shrink-0 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-sky/15">
            <UserIcon className="h-3 w-3 text-brand-sky" />
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-left text-xs font-medium text-ink-900 sm:text-sm">
          {label}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-400" />
      </button>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="关闭菜单"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-black/5 bg-white py-1 shadow-xl">
            <div className="border-b border-black/5 px-3 py-2">
              <p className="truncate text-sm font-medium text-ink-900">{label}</p>
              <p className="truncate text-xs text-ink-400">
                {user.email || user.username}
              </p>
            </div>
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-ink-900 transition hover:bg-bg-100"
              onClick={() => setMenuOpen(false)}
            >
              <UserIcon className="h-4 w-4" />
              个人资料 / 签到
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-ink-900 transition hover:bg-bg-100"
              onClick={() => setMenuOpen(false)}
            >
              <HistoryIcon className="h-4 w-4" />
              生图历史
            </Link>
            {user.isAdmin ? (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-ink-900 transition hover:bg-bg-100"
                onClick={() => setMenuOpen(false)}
              >
                <Shield className="h-4 w-4" />
                用户管理
              </Link>
            ) : null}
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-ink-500 transition hover:bg-bg-100 hover:text-ink-900"
              onClick={logout}
              disabled={busy}
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function notifyUserRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("PixSpring:user-refresh"));
  }
}
