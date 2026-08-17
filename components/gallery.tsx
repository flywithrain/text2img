"use client";

import { useState } from "react";
import {
  Trash2,
  Download,
  Clock,
  Sparkles,
  Image as ImageIcon,
  Copy,
  Check,
  Cpu,
} from "lucide-react";
import { ImageResult } from "@/lib/types";

interface Props {
  items: ImageResult[];
  onSelect?: (item: ImageResult) => void;
  onDelete: (id: string) => void;
  activeId?: string;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Card({
  it,
  onSelect,
  onDelete,
  active,
}: {
  it: ImageResult;
  onSelect?: (item: ImageResult) => void;
  onDelete: (id: string) => void;
  active?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(it.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板不可用时静默失败
    }
  }

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-xl border bg-white transition ${
        active
          ? "border-brand-sky shadow-md"
          : "border-black/5 hover:border-black/10 hover:shadow-sm"
      }`}
    >
      {/* 图片 */}
      <div className="relative overflow-hidden">
        {onSelect ? (
          <button type="button" onClick={() => onSelect(it)} className="block w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={it.imageUrl}
              alt={it.prompt}
              className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </button>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={it.imageUrl}
            alt={it.prompt}
            className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
          />
        )}
        {/* 模式标签 */}
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {it.mode === "edit" ? (
            <><ImageIcon className="h-3 w-3" /> 编辑</>
          ) : (
            <><Sparkles className="h-3 w-3" /> 文生图</>
          )}
        </span>
        {/* 操作按钮 */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1.5 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
          <a
            href={it.imageUrl}
            download={`PixSpring-${it.id}.png`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-black/50 p-1.5 text-white transition hover:bg-brand-sky/80"
            aria-label="下载"
          >
            <Download className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => onDelete(it.id)}
            className="rounded-md bg-black/50 p-1.5 text-white transition hover:bg-red-500/80"
            aria-label="删除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 提示词 + 元信息 */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start gap-1.5">
          <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-ink-700" title={it.prompt}>
            {it.prompt}
          </p>
          <button
            type="button"
            onClick={copyPrompt}
            className={`shrink-0 rounded-md p-1 transition ${
              copied
                ? "text-emerald-600"
                : "text-ink-300 hover:bg-bg-100 hover:text-brand-sky"
            }`}
            title="复制完整提示词"
            aria-label="复制完整提示词"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 text-[11px] text-ink-300">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(it.createdAt)}
          </span>
          {it.modelName ? (
            <span className="flex max-w-[55%] items-center gap-1">
              <Cpu className="h-3 w-3 shrink-0" />
              <span className="truncate rounded bg-bg-200 px-1.5 py-0.5 font-medium text-ink-500">
                {it.modelName}
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Gallery({ items, onSelect, onDelete, activeId }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-500">
        暂无历史记录。登录后生成的图片会保存到云端，可在此查看与下载。
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {items.map((it) => (
        <Card
          key={it.id}
          it={it}
          onSelect={onSelect}
          onDelete={onDelete}
          active={activeId === it.id}
        />
      ))}
    </div>
  );
}
