﻿"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wand2,
  Shield,
  Loader2,
  Mail,
  User as UserIcon,
  Coins,
  Image as ImageIcon,
  CalendarDays,
  ChevronRight,
  LogIn,
  X,
  Download,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth-button";
import { Gallery } from "@/components/gallery";
import type { ImageResult } from "@/lib/types";

interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  credits: number;
  isAdmin: boolean;
  lastCheckIn: string | null;
  createdAt: string;
  generationCount: number;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userImages, setUserImages] = useState<ImageResult[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (res.status === 401) {
        setForbidden(true);
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "加载失败");
      setUsers(json.items ?? []);
    } catch (e: any) {
      setError(e?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function viewUserImages(user: AdminUser) {
    setSelectedUser(user);
    setUserImages([]);
    setImagesLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/generations`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "加载失败");
      setUserImages(json.items ?? []);
    } catch (e: any) {
      setError(e?.message || "加载失败");
    } finally {
      setImagesLoading(false);
    }
  }

  function closeUserImages() {
    setSelectedUser(null);
    setUserImages([]);
  }

  if (forbidden) {
    return (
      <div className="min-h-screen bg-bg-100">
        <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-black/5 bg-bg-50/80 backdrop-blur-xl">
          <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-1.5 text-sm text-ink-500 transition hover:text-ink-900">
                <ArrowLeft className="h-4 w-4" /> 返回
              </Link>
              <span className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-sky to-brand-meadow">
                  <Wand2 className="h-4 w-4 text-white" />
                </span>
                <span className="font-bold">用户管理</span>
              </span>
            </div>
            <AuthButton />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6">
          <GlassCard className="text-center">
            <LogIn className="mx-auto mb-4 h-10 w-10 text-ink-300" />
            <p className="mb-4 text-ink-500">无权限访问，仅管理员可查看</p>
            <Link href="/">
              <Button variant="primary">返回首页</Button>
            </Link>
          </GlassCard>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-100">
      {/* 顶部导航 */}
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-black/5 bg-bg-50/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-ink-500 transition hover:text-ink-900">
              <ArrowLeft className="h-4 w-4" /> 返回
            </Link>
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-sky to-brand-meadow">
                <Shield className="h-4 w-4 text-white" />
              </span>
              <span className="font-bold">用户管理</span>
            </span>
          </div>
          <AuthButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6">
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-sky" />
          </div>
        ) : (
          <>
            {/* 统计 */}
            <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <GlassCard className="p-4">
                <p className="text-xs text-ink-400">总用户数</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-ink-900">
                  {users.length}
                </p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="text-xs text-ink-400">总生图数</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-ink-900">
                  {users.reduce((s, u) => s + u.generationCount, 0)}
                </p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="text-xs text-ink-400">管理员</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-ink-900">
                  {users.filter((u) => u.isAdmin).length}
                </p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="text-xs text-ink-400">今日签到</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-ink-900">
                  {users.filter((u) => {
                    const today = new Intl.DateTimeFormat("en-CA", {
                      timeZone: "Asia/Shanghai",
                    }).format(new Date());
                    return u.lastCheckIn === today;
                  }).length}
                </p>
              </GlassCard>
            </div>

            {/* 用户列表 */}
            <GlassCard>
              <h2 className="mb-4 text-sm font-semibold text-ink-900">用户列表</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/5 text-left text-xs text-ink-400">
                      <th className="pb-2 pr-4 font-medium">用户名</th>
                      <th className="pb-2 pr-4 font-medium">邮箱</th>
                      <th className="pb-2 pr-4 text-right font-medium">积分</th>
                      <th className="pb-2 pr-4 text-right font-medium">生图数</th>
                      <th className="pb-2 pr-4 font-medium">注册时间</th>
                      <th className="pb-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-black/5 last:border-0 hover:bg-bg-50"
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-ink-900">
                              {u.username}
                            </span>
                            {u.isAdmin ? (
                              <span className="rounded bg-brand-sky/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-sky">
                                管理员
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-ink-500">
                          {u.email || "—"}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums text-amber-600">
                          {u.credits}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums text-ink-700">
                          {u.generationCount}
                        </td>
                        <td className="py-3 pr-4 text-xs text-ink-400">
                          {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                        </td>
                        <td className="py-3">
                          {u.generationCount > 0 ? (
                            <button
                              type="button"
                              onClick={() => viewUserImages(u)}
                              className="flex items-center gap-1 text-xs text-brand-sky transition hover:text-brand-sky"
                            >
                              查看 {u.generationCount} 张
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          ) : (
                            <span className="text-xs text-ink-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </>
        )}
      </main>

      {/* 用户图片弹窗 */}
      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/5 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-sky/15">
                  <ImageIcon className="h-5 w-5 text-brand-sky" />
                </span>
                <div>
                  <p className="font-semibold text-ink-900">
                    {selectedUser.username} 的生图历史
                  </p>
                  <p className="text-xs text-ink-400">
                    {selectedUser.email || selectedUser.username} · {userImages.length} 张
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeUserImages}
                className="rounded-lg p-2 text-ink-400 transition hover:bg-bg-100 hover:text-ink-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              {imagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-sky" />
                </div>
              ) : userImages.length > 0 ? (
                <Gallery items={userImages} onDelete={() => {}} />
              ) : (
                <p className="py-12 text-center text-sm text-ink-400">
                  该用户暂无生图记录
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
