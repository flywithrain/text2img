export type ImageMode = "generation" | "edit";

/** provider 适配器类型（与 lib/image-api.ts 保持一致） */
export type ModelProvider = "stepfun" | "openai" | "gemini";

/** 前端可见的模型信息（不含 apiKey） */
export interface ModelOption {
  id: string;
  name: string;
  provider: ModelProvider;
  model: string;
  isDefault: boolean;
}

export const IMAGE_SIZES = [
  { label: "方形 1024×1024", value: "1024x1024" },
  { label: "竖版 768×1360", value: "768x1360" },
  { label: "竖版 896×1184", value: "896x1184" },
  { label: "横版 1360×768", value: "1360x768" },
  { label: "横版 1184×896", value: "1184x896" },
] as const;

export interface GenerateRequest {
  model: string;
  prompt: string;
  response_format: "b64_json";
  cfg_scale?: number;
  steps?: number;
  seed?: number;
  size?: string;
  text_mode?: boolean;
  negative_prompt?: string;
}

export interface EditParams {
  prompt: string;
  image: File;
  cfg_scale?: number;
  steps?: number;
  seed?: number;
  text_mode?: boolean;
  negative_prompt?: string;
  size?: string;
}

export interface ImageResult {
  id: string;
  mode: ImageMode;
  prompt: string;
  imageUrl: string;
  createdAt: number;
  /** 生成时使用的模型显示名 */
  modelName?: string;
}
