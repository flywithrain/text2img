export type ImageMode = "generation" | "edit";

export const STEP_MODEL =
  (process.env.STEP_MODEL as string) || "step-image-edit-2";

export interface GenerateRequest {
  model: typeof STEP_MODEL;
  prompt: string;
  response_format: "b64_json";
  cfg_scale?: number;
  steps?: number;
  seed?: number;
  text_mode?: boolean;
}

export interface EditParams {
  prompt: string;
  image: File;
  cfg_scale?: number;
  steps?: number;
  seed?: number;
  text_mode?: boolean;
}

export interface ImageResult {
  id: string;
  mode: ImageMode;
  prompt: string;
  imageB64: string; // data URL: data:image/png;base64,...
  createdAt: number;
}
