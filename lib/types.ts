export type ImageMode = "generation" | "edit";

export const IMAGE_MODEL =
  (process.env.IMAGE_MODEL_NAME as string) || "step-image-edit-2";

export const IMAGE_SIZES = [
  { label: "方形 1024×1024", value: "1024x1024" },
  { label: "竖版 768×1360", value: "768x1360" },
  { label: "竖版 896×1184", value: "896x1184" },
  { label: "横版 1360×768", value: "1360x768" },
  { label: "横版 1184×896", value: "1184x896" },
] as const;

export interface GenerateRequest {
  model: typeof IMAGE_MODEL;
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
}

export interface ImageResult {
  id: string;
  mode: ImageMode;
  prompt: string;
  imageUrl: string;
  createdAt: number;
}
