"use client";

import { Download, Share2, Loader2, Sparkles } from "lucide-react";

interface Props {
  image: string | null; // data URL 或 Blob URL
  loading: boolean;
  prompt: string;
  mode: "generation" | "edit";
}

export function ImageResultView({ image, loading, prompt, mode }: Props) {
  const handleDownload = () => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = `PixSpring-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  const handleShare = async () => {
    if (!image) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: "PixSpring 创作", text: prompt, url: image });
        return;
      }
    } catch {
      /* 用户取消或不支持 */
    }
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      /* 忽略 */
    }
  };

  if (loading) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-4 rounded-2xl border border-black/5 bg-bg-100">
        <Loader2 className="h-10 w-10 animate-spin text-brand-sky" />
        <p className="text-sm text-ink-500">
          {mode === "edit" ? "正在编辑图片…" : "AI 正在绘制你的画面…"}
        </p>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-bg-200 text-center">
        <Sparkles className="h-10 w-10 text-brand-sky/70" />
        <p className="px-6 text-sm text-ink-500">
          在左侧输入提示词并点击「开始生成」，<br />你的作品会在这里绽放。
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt={prompt}
        className="w-full rounded-2xl border border-black/5 shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
      />
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 bg-bg-100 px-4 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-bg-200"
        >
          <Download className="h-4 w-4" /> 下载
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 bg-bg-100 px-4 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-bg-200"
        >
          <Share2 className="h-4 w-4" /> 分享
        </button>
      </div>
    </div>
  );
}
