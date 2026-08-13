"use client";

import { useEffect, useState } from "react";
import { Sparkles, Image as ImageIcon, Wand2, AlertCircle, Compass, Braces, Calculator, History as HistoryIcon } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/ui/glass-card";
import { PromptForm } from "@/components/prompt-form";
import { ParamControls, GenParams } from "@/components/param-controls";
import { ImageUpload } from "@/components/image-upload";
import { ImageResultView } from "@/components/image-result";
import { AuthButton, notifyUserRefresh } from "@/components/auth-button";
import { ImageResult } from "@/lib/types";

const DEFAULT_PARAMS: GenParams = {
  cfg_scale: 1.0,
  steps: 8,
  seed: 1,
  text_mode: true,
};

export default function Home() {
  const [mode, setMode] = useState<"generation" | "edit">("generation");
  const [prompt, setPrompt] = useState("");
  const [params, setParams] = useState<GenParams>(DEFAULT_PARAMS);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageResult | null>(null);
  const [historyCount, setHistoryCount] = useState(0);

  async function loadHistoryCount() {
    try {
      const res = await fetch("/api/history?limit=1", { cache: "no-store" });
      if (res.status === 401) {
        setHistoryCount(0);
        return;
      }
      const json = await res.json();
      setHistoryCount(json.items?.length ?? 0);
    } catch {
      setHistoryCount(0);
    }
  }

  useEffect(() => {
    void loadHistoryCount();
    const onRefresh = () => void loadHistoryCount();
    window.addEventListener("steppix:user-refresh", onRefresh);
    return () => window.removeEventListener("steppix:user-refresh", onRefresh);
  }, []);

  const handleParams = (next: Partial<GenParams>) =>
    setParams((p) => ({ ...p, ...next }));

  const switchMode = (m: string) => {
    setMode(m as "generation" | "edit");
    setError(null);
  };

  async function handleSubmit() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      let b64: string;
      let imageUrl: string;
      let id: string;
      let createdAt: number;

      if (mode === "generation") {
        const res = await fetch("/api/images/generations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt.trim(), ...params }),
        });
        const json = await res.json();
        if (res.status === 401) {
          throw new Error(json.error || "请先登录");
        }
        if (res.status === 402) {
          throw new Error(json.error || "生图次数不足，请先签到");
        }
        if (!res.ok) throw new Error(json.error || "生成失败");
        b64 = json.b64_json;
        imageUrl = json.imageUrl;
        id = json.id;
        createdAt = json.createdAt ?? Date.now();
        if (typeof json.credits === "number") notifyUserRefresh();
      } else {
        if (!imageFile) {
          setError("请先上传参考图");
          setLoading(false);
          return;
        }
        const fd = new FormData();
        fd.append("prompt", prompt.trim());
        fd.append("image", imageFile);
        Object.entries(params).forEach(([k, v]) => fd.append(k, String(v)));
        const res = await fetch("/api/images/edits", {
          method: "POST",
          body: fd,
        });
        const json = await res.json();
        if (res.status === 401) {
          throw new Error(json.error || "请先登录");
        }
        if (res.status === 402) {
          throw new Error(json.error || "生图次数不足，请先签到");
        }
        if (!res.ok) throw new Error(json.error || "编辑失败");
        b64 = json.b64_json;
        imageUrl = json.imageUrl;
        id = json.id;
        createdAt = json.createdAt ?? Date.now();
        if (typeof json.credits === "number") notifyUserRefresh();
      }

      const item: ImageResult = {
        id: id || `${Date.now()}`,
        mode,
        prompt: prompt.trim(),
        imageUrl,
        createdAt,
      };
      setResult(item);
      setHistoryCount((c) => c + 1);
    } catch (e: any) {
      setError(e?.message || "请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-black/5 bg-bg-50/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo to-brand-purple shadow-lg shadow-brand-violet/30">
              <Wand2 className="h-5 w-5 text-white" />
            </span>
            <span className="hidden text-lg font-bold tracking-tight text-ink-900 sm:inline">StepPix</span>
            <span className="hidden text-xs text-ink-400 sm:inline">
              AI 文生图 · 由 StepFun 驱动
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Tabs value={mode} onValueChange={switchMode}>
              <TabsList>
                <TabsTrigger value="generation" className="px-2 sm:px-4">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> <span className="hidden md:inline">文生图</span>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="edit" className="px-2 sm:px-4">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4" /> <span className="hidden md:inline">图像编辑</span>
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Link
              href="/history"
              className="flex items-center gap-1.5 rounded-xl border border-black/5 bg-bg-100 px-2.5 py-2 text-sm font-medium text-ink-500 transition hover:bg-bg-200 hover:text-ink-900"
            >
              <HistoryIcon className="h-4 w-4" />
              <span className="hidden md:inline">历史</span>
            </Link>
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

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          <div className="space-y-5">
            <GlassCard>
              <PromptForm
                prompt={prompt}
                onPromptChange={setPrompt}
                onSubmit={handleSubmit}
                loading={loading}
                mode={mode}
              />
            </GlassCard>

            {mode === "edit" ? (
              <GlassCard>
                <ImageUpload file={imageFile} onChange={setImageFile} />
              </GlassCard>
            ) : null}

            <GlassCard>
              <h2 className="mb-4 text-sm font-semibold text-ink-900">
                高级参数
              </h2>
              <ParamControls params={params} onChange={handleParams} />
            </GlassCard>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <ImageResultView
              image={result?.imageUrl ?? null}
              loading={loading}
              prompt={prompt}
              mode={mode}
            />

            <Link href="/history" className="block">
              <GlassCard className="transition hover:border-brand-violet/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HistoryIcon className="h-5 w-5 text-brand-violet" />
                    <div>
                      <p className="text-sm font-semibold text-ink-900">历史画廊</p>
                      <p className="text-xs text-ink-400">
                        {historyCount > 0
                          ? `${historyCount} 张作品 · 点击查看全部并下载`
                          : "点击查看全部历史记录"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-ink-400">→</span>
                </div>
              </GlassCard>
            </Link>
          </div>
        </div>

        <footer className="mt-10 text-center text-xs text-ink-400">
          本站点通过服务端代理调用 StepFun Step Plan 接口，API Key 仅存储于服务端环境变量，
          不会下发到浏览器。图片由 AI 生成，请遵守相关使用规范。
        </footer>
      </main>
    </div>
  );
}
