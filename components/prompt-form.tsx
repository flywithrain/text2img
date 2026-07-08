"use client";

import { Sparkles, Loader2 } from "lucide-react";

interface Props {
  prompt: string;
  onPromptChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  mode: "generation" | "edit";
}

export function PromptForm({
  prompt,
  onPromptChange,
  onSubmit,
  loading,
  mode,
}: Props) {
  const placeholder =
    mode === "edit"
      ? "描述你希望对图片做的修改，例如：让图中的猫戴上墨镜，背景换成星空"
      : "描述你想要的画面，例如：采菊东篱下，悠然见南山，水墨写意图风格";

  return (
    <div>
      <span className="label-text">提示词 (prompt)</span>
      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        rows={4}
        placeholder={placeholder}
        className="glass-input resize-none"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={loading || !prompt.trim()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-purple px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-violet/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brand-violet/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {loading ? "生成中…" : mode === "edit" ? "开始编辑" : "开始生成"}
      </button>
    </div>
  );
}
