"use client";

import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";

interface Props {
  file: File | null;
  onChange: (f: File | null) => void;
}

export function ImageUpload({ file, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handle = (f: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
    onChange(f);
  };

  return (
    <div>
      <span className="label-text">参考图（编辑模式必填）</span>
      <div
        onClick={() => ref.current?.click()}
        className={`flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-black/10 bg-bg-100 transition hover:border-brand-sky/60 hover:bg-bg-200 ${
          preview ? "border-solid border-black/5" : ""
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="预览" className="h-full w-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-ink-500">
            <UploadCloud className="h-8 w-8" />
            <span className="px-4 text-center text-sm">
              点击上传参考图（最大 4096×4096）
            </span>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <button
          type="button"
          onClick={() => handle(null)}
          className="mt-2 inline-flex items-center gap-1 text-xs text-ink-500 transition hover:text-ink-900"
        >
          <X className="h-3.5 w-3.5" /> 移除图片
        </button>
      ) : null}
    </div>
  );
}
