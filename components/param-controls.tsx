"use client";

import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";

export interface GenParams {
  cfg_scale: number;
  steps: number;
  seed: number;
  text_mode: boolean;
}

interface Props {
  params: GenParams;
  onChange: (next: Partial<GenParams>) => void;
}

export function ParamControls({ params, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-ink-500">引导系数 (cfg_scale)</span>
          <span className="text-sm font-semibold text-brand-violet">
            {params.cfg_scale.toFixed(1)}
          </span>
        </div>
        <Slider
          value={params.cfg_scale}
          min={0}
          max={20}
          step={0.1}
          onChange={(v) => onChange({ cfg_scale: v })}
        />
        <p className="mt-1 text-xs text-ink-500">
          数值越高越贴近提示词；过低则更自由发散。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="label-text">推理步数 (steps)</span>
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
          <span className="label-text">随机种子 (seed)</span>
          <input
            type="number"
            value={params.seed}
            onChange={(e) => onChange({ seed: Number(e.target.value) })}
            className="glass-input"
          />
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="label-text mb-0">文本模式 (text_mode)</span>
          <p className="text-xs text-ink-500">开启后偏向生成带文字内容的图文。</p>
        </div>
        <div className="pt-1">
          <Switch
            checked={params.text_mode}
            onChange={(v) => onChange({ text_mode: v })}
          />
        </div>
      </div>
    </div>
  );
}
