"use client";

import { useState } from "react";
import { Sparkles, Image as ImageIcon, Wand2, AlertCircle, Compass, Braces, Calculator } from "lucide-react";
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
  seed: 0,
  text_mode: false,
  size: "1024x1024",
  negative_prompt: "",
};

export default function Home() {
  const [mode, setMode] = useState<"generation" | "edit">("generation");
  const [prompt, setPrompt] = useState("");
  const [params, setParams] = useState<GenParams>(DEFAULT_PARAMS);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageResult | null>(null);

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
          body: JSON.stringify({
            prompt: prompt.trim(),
            cfg_scale: params.cfg_scale,
            steps: params.steps,
            seed: params.seed || undefined,
            size: params.size,
            text_mode: params.text_mode,
            negative_prompt: params.negative_prompt || undefined,
          }),
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
        fd.append("cfg_scale", String(params.cfg_scale));
        fd.append("steps", String(params.steps));
        if (params.seed) fd.append("seed", String(params.seed));
        fd.append("text_mode", String(params.text_mode));
        if (params.negative_prompt.trim())
          fd.append("negative_prompt", params.negative_prompt.trim());
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
    } catch (e: any) {
      setError(e?.message || "请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      {/* 顶部导航 */}
      <header className="z-50 flex h-16 shrink-0 items-center justify-between border-b border-black/5 bg-bg-50/80 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-sky to-brand-meadow shadow-lg shadow-brand-sky/30">
            <Wand2 className="h-5 w-5 text-white" />
          </span>
          <span className="hidden text-lg font-bold tracking-tight text-ink-900 sm:inline">PixSpring</span>
          <span className="hidden text-xs text-ink-400 sm:inline">
            AI 文生图
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
      </header>

      {/* 主体：左侧工具栏 + 右侧预览 */}
      <div className="flex min-h-0 flex-1">
        {/* 左侧工具栏 — 占满整页高度，可滚动 */}
        <aside className="flex w-full flex-col overflow-y-auto border-r border-black/5 bg-bg-100 lg:w-[420px] lg:shrink-0">
          <div className="space-y-4 p-4">
            {/* 提示词输入 */}
            <GlassCard>
              <PromptForm
                prompt={prompt}
                onPromptChange={setPrompt}
                onSubmit={handleSubmit}
                loading={loading}
                mode={mode}
              />
            </GlassCard>

            {/* 图像编辑模式：上传参考图 */}
            {mode === "edit" ? (
              <GlassCard>
                <ImageUpload file={imageFile} onChange={setImageFile} />
              </GlassCard>
            ) : null}

            {/* 高级参数 */}
            <GlassCard>
              <h2 className="mb-4 text-sm font-semibold text-ink-900">
                高级参数
              </h2>
              <ParamControls params={params} onChange={handleParams} mode={mode} />
            </GlassCard>

            {/* 错误提示 */}
            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
          </div>
        </aside>

        {/* 右侧预览区 */}
        <main className="hidden min-w-0 flex-1 lg:block">
          <div className="h-full overflow-y-auto p-6">
            <div className="mx-auto max-w-4xl space-y-6">
              <ImageResultView
                image={result?.imageUrl ?? null}
                loading={loading}
                prompt={prompt}
                mode={mode}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
