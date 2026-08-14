﻿"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wand2,
  Trash2,
  Download,
  Loader2,
  History as HistoryIcon,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Gallery } from "@/components/gallery";
import { ImageResult } from "@/lib/types";
import { notifyUserRefresh } from "@/components/auth-button";

export default function HistoryPage() {
  const [items, setItems] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/history?limit=100", { cache: "no-store" });
      if (res.status === 401) {
        setLoggedIn(false);
        setItems([]);
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "加载失败");
      setItems(json.items ?? []);
      setLoggedIn(true);
    } catch (e: any) {
      setError(e?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/history?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "删除失败");
      }
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e?.message || "删除失败");
    } finally {
      setDeleting(null);
    }
  }

  function downloadAll() {
    items.forEach((it, i) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = it.imageUrl;
        a.download = `PixSpring-${it.id}.png`;
        a.target = "_blank";
        a.click();
      }, i * 300);
    });
  }

  return (
    <div className="min-h-screen">
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-black/5 bg-bg-50/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-sky to-brand-meadow shadow-lg shadow-brand-sky/30">
              <Wand2 className="h-5 w-5 text-white" />
            </span>
            <span className="hidden text-lg font-bold tracking-tight text-ink-900 sm:inline">PixSpring</span>
            <span className="hidden text-xs text-ink-400 sm:inline">
              历史画廊
            </span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl border border-black/5 bg-bg-100 px-3 py-2 text-sm font-medium text-ink-500 transition hover:bg-bg-200 hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HistoryIcon className="h-6 w-6 text-brand-sky" />
            <div>
              <h1 className="text-xl font-bold text-ink-900">历史画廊</h1>
              <p className="text-sm text-ink-400">
                {loading ? "加载中…" : `${items.length} / 100 张 · 点击下载或删除`}
              </p>
            </div>
          </div>
          {items.length > 0 ? (
            <Button variant="outline" className="h-9" onClick={downloadAll}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">全部下载</span>
            </Button>
          ) : null}
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {!loggedIn ? (
          <GlassCard>
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <LogIn className="h-10 w-10 text-ink-300" />
              <p className="text-sm text-ink-500">请先登录后查看历史记录</p>
              <Link href="/login?redirect=/history">
                <Button variant="primary">
                  <LogIn className="h-4 w-4" /> 去登录
                </Button>
              </Link>
            </div>
          </GlassCard>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-sky" />
          </div>
        ) : (
          <GlassCard>
            <Gallery
              items={items}
              onDelete={handleDelete}
            />
            {items.length > 0 ? (
              <p className="mt-4 border-t border-black/5 pt-4 text-center text-xs text-ink-400">
                每用户最多保留 100 张，超出后自动删除最早的记录
              </p>
            ) : null}
          </GlassCard>
        )}
      </main>
    </div>
  );
}
