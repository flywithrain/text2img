"use client";

import { useCallback, useEffect, useState } from "react";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LinuxDoUser } from "@/lib/auth/types";

export function AuthButton() {
  const [user, setUser] = useState<LinuxDoUser | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

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

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } finally {
      setBusy(false);
    }
  }

  // 加载中占位，避免布局跳动
  if (user === undefined) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-xl bg-white/5" aria-hidden />
    );
  }

  if (!user) {
    return (
      <a href="/api/auth/login">
        <Button variant="outline" className="h-9 px-3 text-xs sm:text-sm">
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Linux.do 登录</span>
          <span className="sm:hidden">登录</span>
        </Button>
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex max-w-[9rem] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 sm:max-w-[12rem]">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="h-6 w-6 shrink-0 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-violet/30">
            <UserIcon className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="truncate text-xs font-medium text-[#F4F4F8] sm:text-sm">
          {user.name || user.username}
        </span>
      </div>
      <Button
        variant="ghost"
        className="h-9 px-2 text-xs sm:px-3"
        onClick={logout}
        disabled={busy}
        title="退出登录"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">退出</span>
      </Button>
    </div>
  );
}

/** 供页面在生成前检查是否已登录 */
export async function fetchCurrentUser(): Promise<LinuxDoUser | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const json = await res.json();
    return (json.user as LinuxDoUser | null) ?? null;
  } catch {
    return null;
  }
}
