"use client";

import { useState } from "react";
import { HelpCircle, Sparkles } from "lucide-react";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { IMAGE_SIZES, ModelOption } from "@/lib/types";

export interface GenParams {
  cfg_scale: number;
  steps: number;
  seed: number;
  text_mode: boolean;
  size: string;
  negative_prompt: string;
}

interface Props {
  params: GenParams;
  onChange: (next: Partial<GenParams>) => void;
  mode: "generation" | "edit";
  models: ModelOption[];
  modelId: string;
  onModelChange: (id: string) => void;
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <HelpCircle className="h-3.5 w-3.5 cursor-help text-ink-300 transition hover:text-ink-500" />
      {show ? (
        <span className="absolute bottom-full left-1/2 z-50 mb-1.5 w-52 -translate-x-1/2 rounded-lg bg-ink-900 px-3 py-2 text-xs leading-relaxed text-white shadow-xl">
          {text}
        </span>
      ) : null}
    </span>
  );
}

function ParamLabel({ label, tip }: { label: string; tip: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-medium text-ink-500">{label}</span>
      <Tooltip text={tip} />
    </div>
  );
}

export function ParamControls({
  params,
  onChange,
  mode,
  models,
  modelId,
  onModelChange,
}: Props) {
  const selected = models.find((m) => m.id === modelId);
  const provider = selected?.provider;

  return (
    <div className="space-y-5">
      {/* 生图模型 */}
      <div>
        <div className="mb-2">
          <ParamLabel
            label="生图模型"
            tip="选择本次生成使用的 AI 模型。不同模型的效果、风格和支持的参数不同，可在模型管理中由管理员配置。"
          />
        </div>
        {models.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            暂无可用模型，请联系管理员在「模型管理」中添加。
          </p>
        ) : (
          <select
            value={modelId}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-bg-50 px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-brand-sky/50 focus:ring-2 focus:ring-brand-sky/15"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.isDefault ? "（默认）" : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {provider === "gemini" ? (
        <div className="flex items-start gap-2 rounded-xl border border-brand-sky/20 bg-brand-sky/5 px-3 py-2.5 text-xs leading-relaxed text-ink-500">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-sky" />
          <span>
            该模型由 AI 自动决定构图与细节，请在提示词中描述画面比例（如「竖版海报」），
            其余高级参数不适用。
          </span>
        </div>
      ) : null}

      {/* 图片尺寸 — 仅文生图模式且模型支持 */}
      {mode === "generation" && provider !== "gemini" ? (
        <div>
          <div className="mb-2">
            <ParamLabel
              label="图片尺寸 (size)"
              tip="输出图片的分辨率。格式为高×宽。方形适合头像/图标，竖版适合手机壁纸/海报，横版适合桌面壁纸/横幅。"
            />
          </div>
          <select
            value={params.size}
            onChange={(e) => onChange({ size: e.target.value })}
            className="w-full rounded-xl border border-black/10 bg-bg-50 px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-brand-sky/50 focus:ring-2 focus:ring-brand-sky/15"
          >
            {IMAGE_SIZES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* 以下扩展参数仅 stepfun 风格模型支持 */}
      {provider === "stepfun" ? (
        <>
          {/* 引导系数 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <ParamLabel
                label="引导系数 (cfg_scale)"
                tip="Classifier-Free Guidance，控制生成结果对提示词的服从程度。值越高越严格贴合提示词，值越低越自由发散。推荐 1.0，范围 1.0–10.0。注意：大于 1.0 时负面提示词才会生效。"
              />
              <span className="text-sm font-semibold text-brand-sky">
                {params.cfg_scale.toFixed(1)}
              </span>
            </div>
            <Slider
              value={params.cfg_scale}
              min={1}
              max={10}
              step={0.1}
              onChange={(v) => onChange({ cfg_scale: v })}
            />
          </div>

          {/* 推理步数 + 随机种子 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2">
                <ParamLabel
                  label="推理步数 (steps)"
                  tip="扩散模型去噪的迭代次数。步数越多细节越丰富但速度越慢。推荐 8，范围 1–50。大多数场景 4–12 步即可获得良好效果。"
                />
              </div>
              <input
                type="number"
                min={1}
                max={50}
                value={params.steps}
                onChange={(e) => onChange({ steps: Number(e.target.value) })}
                className="glass-input"
              />
            </div>
            <div>
              <div className="mb-2">
                <ParamLabel
                  label="随机种子 (seed)"
                  tip="固定种子可复现相同结果。设为 0 或留空则每次随机生成。范围 0–2147483647。相同种子+相同参数会产生几乎一致的图片。"
                />
              </div>
              <input
                type="number"
                min={0}
                value={params.seed}
                onChange={(e) => onChange({ seed: Number(e.target.value) })}
                className="glass-input"
              />
            </div>
          </div>

          {/* 负面提示词 */}
          <div>
            <div className="mb-2">
              <ParamLabel
                label="负面提示词 (negative_prompt)"
                tip="描述你不希望出现在图片中的内容，如「模糊、低质量、变形的手」。仅当引导系数 > 1.0 时生效。最长 512 字符。"
              />
            </div>
            <textarea
              value={params.negative_prompt}
              onChange={(e) =>
                onChange({ negative_prompt: e.target.value.slice(0, 512) })
              }
              rows={2}
              placeholder="如：模糊、低质量、变形、多余手指"
              className="glass-input resize-none text-sm"
            />
          </div>

          {/* 文本模式 */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <ParamLabel
                label="文本模式 (text_mode)"
                tip="针对包含文字内容的场景优化（如海报、Logo、标语）。开启后模型会更努力地正确渲染图片中的文字。如果提示词不涉及文字，关闭即可。"
              />
            </div>
            <div className="pt-0.5">
              <Switch
                checked={params.text_mode}
                onChange={(v) => onChange({ text_mode: v })}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
