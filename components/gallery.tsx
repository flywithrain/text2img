﻿"use client";

import { Trash2, Download, Clock, Sparkles, Image as ImageIcon } from "lucide-react";
import { ImageResult } from "@/lib/types";

interface Props {
  items: ImageResult[];
  onSelect?: (item: ImageResult) => void;
  onDelete: (id: string) => void;
  activeId?: string;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);

  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  if (hr < 24) return `${hr} 小时前`;
  if (day < 7) return `${day} 天前`;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
        <div
          key={it.id}
          className={`group flex flex-col overflow-hidden rounded-xl border bg-white transition ${
            activeId === it.id
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

          {/* 提示词 + 时间 */}
          <div className="flex flex-1 flex-col gap-2 p-3">
            <p className="line-clamp-2 text-xs leading-relaxed text-ink-700" title={it.prompt}>
              {it.prompt}
            </p>
            <div className="mt-auto flex items-center gap-1 text-[11px] text-ink-300">
              <Clock className="h-3 w-3" />
              {formatTime(it.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
