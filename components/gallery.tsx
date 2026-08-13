"use client";

import { Trash2, Download } from "lucide-react";
import { ImageResult } from "@/lib/types";

interface Props {
  items: ImageResult[];
  onSelect?: (item: ImageResult) => void;
  onDelete: (id: string) => void;
  activeId?: string;
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.id}
          className={`group relative overflow-hidden rounded-xl border transition ${
            activeId === it.id ? "border-brand-violet" : "border-black/5"
          }`}
        >
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
          <div className="absolute inset-x-0 top-0 truncate bg-gradient-to-b from-black/70 to-transparent p-2 text-[10px] text-white/90 opacity-0 transition group-hover:opacity-100">
            {it.prompt}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onDelete(it.id)}
              className="rounded-md bg-black/40 p-1.5 text-white transition hover:bg-red-500/70"
              aria-label="删除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <a
              href={it.imageUrl}
              download={`steppix-${it.id}.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-black/40 p-1.5 text-white transition hover:bg-brand-violet/70"
              aria-label="下载"
            >
              <Download className="h-4 w-4" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
