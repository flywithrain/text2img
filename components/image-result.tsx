"use client";

import { Download, Share2, Loader2, Sparkles } from "lucide-react";

interface Props {
  image: string | null; // data URL
  loading: boolean;
  prompt: string;
  mode: "generation" | "edit";
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [head, b64] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] ?? "image/png";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

export function ImageResultView({ image, loading, prompt, mode }: Props) {
  const handleDownload = () => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = `stepfun-${Date.now()}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (!image) return;
    const file = dataUrlToFile(image, `stepfun-${Date.now()}.png`);
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "StepFun 创作", text: prompt });
        return;
      }
    } catch {
      /* 用户取消或不支持，回退到复制提示词 */
    }
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      /* 忽略 */
    }
  };

  if (loading) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5">
        <Loader2 className="h-10 w-10 animate-spin text-brand-violet" />
        <p className="text-sm text-[#C7C7D1]">
          {mode === "edit" ? "正在编辑图片…" : "AI 正在绘制你的画面…"}
        </p>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-center">
        <Sparkles className="h-10 w-10 text-brand-violet/70" />
        <p className="px-6 text-sm text-[#C7C7D1]/80">
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
        className="w-full rounded-2xl border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
      />
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-[#F4F4F8] transition hover:bg-white/10"
        >
          <Download className="h-4 w-4" /> 下载
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-[#F4F4F8] transition hover:bg-white/10"
        >
          <Share2 className="h-4 w-4" /> 分享
        </button>
      </div>
    </div>
  );
}
