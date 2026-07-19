"use client";

import { useEffect, useState } from "react";
import { Sparkles, Image as ImageIcon, Wand2, AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/ui/glass-card";
import { PromptForm } from "@/components/prompt-form";
import { ParamControls, GenParams } from "@/components/param-controls";
import { ImageUpload } from "@/components/image-upload";
import { ImageResultView } from "@/components/image-result";
import { Gallery } from "@/components/gallery";
import { AuthButton } from "@/components/auth-button";
import { ImageResult } from "@/lib/types";
import { addHistory, loadHistory, removeHistory } from "@/lib/storage";

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
  const [history, setHistory] = useState<ImageResult[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
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

      if (mode === "generation") {
        const res = await fetch("/api/images/generations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt.trim(), ...params }),
        });
        const json = await res.json();
        if (res.status === 401) {
          throw new Error(json.error || "请先使用 Linux.do 登录");
        }
        if (!res.ok) throw new Error(json.error || "生成失败");
        b64 = json.b64_json;
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
          throw new Error(json.error || "请先使用 Linux.do 登录");
        }
        if (!res.ok) throw new Error(json.error || "编辑失败");
        b64 = json.b64_json;
      }

      const item: ImageResult = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        mode,
        prompt: prompt.trim(),
        imageB64: `data:image/png;base64,${b64}`,
        createdAt: Date.now(),
      };
      setResult(item);
      setHistory(addHistory(item));
    } catch (e: any) {
      setError(e?.message || "请求失败");
    } finally {
      setLoading(false);
    }
  }

  // 登录回调错误提示（?auth_error=...）
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const authErr = sp.get("auth_error");
    if (authErr) {
      setError(`登录失败：${authErr}`);
      // 清掉 URL 参数，避免刷新重复提示
      const url = new URL(window.location.href);
      url.searchParams.delete("auth_error");
      url.searchParams.delete("auth");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, []);

  return (
    <div className="min-h-screen">
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-white/10 bg-bg-900/70 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo to-brand-purple shadow-lg shadow-brand-violet/40">
              <Wand2 className="h-5 w-5 text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight">StepPix</span>
            <span className="hidden text-xs text-[#C7C7D1]/70 sm:inline">
              AI 文生图 · 由 StepFun 驱动
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Tabs value={mode} onValueChange={switchMode}>
              <TabsList>
                <TabsTrigger value="generation">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> 文生图
                  </span>
                </TabsTrigger>
                <TabsTrigger value="edit">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4" /> 图像编辑
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          {/* 左侧控制面板 */}
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
              <h2 className="mb-4 text-sm font-semibold text-[#F4F4F8]">
                高级参数
              </h2>
              <ParamControls params={params} onChange={handleParams} />
            </GlassCard>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
          </div>

          {/* 右侧结果与画廊 */}
          <div className="space-y-6">
            <ImageResultView
              image={result?.imageB64 ?? null}
              loading={loading}
              prompt={prompt}
              mode={mode}
            />

            <GlassCard>
              <h2 className="mb-4 text-sm font-semibold text-[#F4F4F8]">
                历史画廊
                <span className="ml-2 text-xs font-normal text-[#C7C7D1]/60">
                  {history.length} 张 · 点击查看大图
                </span>
              </h2>
              <Gallery
                items={history}
                activeId={result?.id}
                onSelect={(it) => setResult(it)}
                onDelete={(id) => {
                  const next = removeHistory(id);
                  setHistory(next);
                  if (result?.id === id) setResult(null);
                }}
              />
            </GlassCard>
          </div>
        </div>

        <footer className="mt-10 text-center text-xs text-[#C7C7D1]/50">
          本站点通过服务端代理调用 StepFun Step Plan 接口，API Key 仅存储于服务端环境变量，
          不会下发到浏览器。图片由 AI 生成，请遵守相关使用规范。
        </footer>
      </main>
    </div>
  );
}
