import { prisma } from "@/lib/db";
import { EditParams, GenerateRequest } from "./types";

export type ModelProvider = "stepfun" | "openai" | "gemini";

/** 一次生图请求所用的模型配置（来自数据库或环境变量兜底） */
export interface ModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  model: string;
  baseUrl: string;
  apiKey: string;
}

const ENV_TIMEOUT_MS = Number(process.env.IMAGE_API_TIMEOUT_MS) || 90_000;

const PROVIDER_BASE_URLS: Record<ModelProvider, string> = {
  stepfun: "https://api.stepfun.com/step_plan/v1",
  openai: "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
};

function trimBase(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

/**
 * 解析生图请求要用的模型：
 * 1. 指定 modelId 时取对应启用模型；
 * 2. 未指定时取默认启用模型；
 * 3. 数据库无任何模型时回退到环境变量（IMAGE_API_*，stepfun 风格）。
 */
export async function resolveModel(modelId?: string): Promise<ModelConfig> {
  if (modelId) {
    const row = await prisma.imageModel.findUnique({ where: { id: modelId } });
    if (!row || !row.enabled) throw new Error("所选模型不存在或已停用");
    return toConfig(row);
  }

  const fallback = await prisma.imageModel.findFirst({
    where: { enabled: true, isDefault: true },
  });
  if (fallback) return toConfig(fallback);

  const anyEnabled = await prisma.imageModel.findFirst({
    where: { enabled: true },
    orderBy: { createdAt: "asc" },
  });
  if (anyEnabled) return toConfig(anyEnabled);

  const envKey = process.env.IMAGE_API_KEY;
  if (envKey) {
    return {
      id: "env-default",
      name: "默认模型",
      provider: "stepfun",
      model: process.env.IMAGE_MODEL_NAME || "step-image-edit-2",
      baseUrl:
        process.env.IMAGE_API_BASE_URL ?? PROVIDER_BASE_URLS.stepfun,
      apiKey: envKey,
    };
  }
  throw new Error("服务端未配置任何生图模型，请联系管理员");
}

function toConfig(row: {
  id: string;
  name: string;
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
}): ModelConfig {
  const provider = (["stepfun", "openai", "gemini"] as const).includes(
    row.provider as ModelProvider,
  )
    ? (row.provider as ModelProvider)
    : "openai";
  return {
    id: row.id,
    name: row.name,
    provider,
    model: row.model,
    baseUrl: trimBase(row.baseUrl || PROVIDER_BASE_URLS[provider]),
    apiKey: row.apiKey,
  };
}

function isAuthError(message: string): boolean {
  return /401|403|unauthor|invalid.*key|鉴权|未授权|API key/i.test(message);
}

function wrapError(e: any, timeoutMs: number): Error {
  if (e?.name === "AbortError")
    throw new Error(`请求超时（${Math.round(timeoutMs / 1000)}s）`);
  if (isAuthError(e?.message ?? ""))
    throw new Error("鉴权失败：请检查该模型的 API Key 是否有效");
  throw e instanceof Error ? e : new Error(String(e));
}

async function fetchJson(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API 返回 ${res.status}: ${text.slice(0, 300)}`);
    }
    return await res.json();
  } catch (e: any) {
    throw wrapError(e, timeoutMs);
  } finally {
    clearTimeout(timer);
  }
}

/** 下载 URL 图片并转为 base64（部分 OpenAI 兼容服务返回 url 而非 b64） */
async function urlToB64(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`图片下载失败 ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString("base64");
}

/** 从不同 provider 的响应中提取 base64 图片 */
async function extractB64(json: any): Promise<string> {
  // OpenAI 兼容格式
  const item = json?.data?.[0];
  if (item?.b64_json && typeof item.b64_json === "string") return item.b64_json;
  if (typeof item?.url === "string" && item.url) return urlToB64(item.url);
  // Gemini 原生格式
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const data = p?.inlineData?.data ?? p?.inline_data?.data;
    if (typeof data === "string" && data) return data;
  }
  throw new Error("响应中未找到图片数据");
}

/** OpenAI 新版图像模型（gpt-image-* / dall-e-*）不接受 response_format 参数 */
function needsResponseFormat(model: string): boolean {
  return !/^(gpt-image|dall-e)/i.test(model);
}

async function fileToB64(file: File): Promise<{ b64: string; mime: string }> {
  const buf = Buffer.from(await file.arrayBuffer());
  return { b64: buf.toString("base64"), mime: file.type || "image/png" };
}

export async function generateImage(
  req: GenerateRequest,
  model: ModelConfig,
  timeoutMs = ENV_TIMEOUT_MS,
): Promise<string> {
  if (model.provider === "gemini") {
    const json = await fetchJson(
      `${model.baseUrl}/models/${encodeURIComponent(model.model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": model.apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: req.prompt }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      },
      timeoutMs,
    );
    return extractB64(json);
  }

  if (model.provider === "openai") {
    const json = await fetchJson(
      `${model.baseUrl}/images/generations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${model.apiKey}`,
        },
        body: JSON.stringify({
          model: model.model,
          prompt: req.prompt,
          n: 1,
          ...(req.size ? { size: req.size } : {}),
          ...(needsResponseFormat(model.model)
            ? { response_format: "b64_json" }
            : {}),
        }),
      },
      timeoutMs,
    );
    return extractB64(json);
  }

  // stepfun：OpenAI 兼容 + 扩展参数
  const json = await fetchJson(
    `${model.baseUrl}/images/generations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${model.apiKey}`,
      },
      body: JSON.stringify({ ...req, model: model.model }),
    },
    timeoutMs,
  );
  return extractB64(json);
}

export async function editImage(
  params: EditParams,
  model: ModelConfig,
  timeoutMs = ENV_TIMEOUT_MS,
): Promise<string> {
  if (model.provider === "gemini") {
    const { b64, mime } = await fileToB64(params.image);
    const json = await fetchJson(
      `${model.baseUrl}/models/${encodeURIComponent(model.model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": model.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType: mime, data: b64 } },
                { text: params.prompt },
              ],
            },
          ],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      },
      timeoutMs,
    );
    return extractB64(json);
  }

  const form = new FormData();
  form.append("model", model.model);
  form.append("image", params.image);
  form.append("prompt", params.prompt);
  if (model.provider === "openai") {
    if (needsResponseFormat(model.model))
      form.append("response_format", "b64_json");
    if (params.size) form.append("size", params.size);
  } else {
    // stepfun 扩展参数
    form.append("response_format", "b64_json");
    if (params.cfg_scale !== undefined)
      form.append("cfg_scale", String(params.cfg_scale));
    if (params.steps !== undefined) form.append("steps", String(params.steps));
    if (params.seed !== undefined) form.append("seed", String(params.seed));
    if (params.text_mode !== undefined)
      form.append("text_mode", String(params.text_mode));
    if (params.negative_prompt !== undefined && params.negative_prompt.trim())
      form.append("negative_prompt", params.negative_prompt.trim());
  }

  const json = await fetchJson(
    `${model.baseUrl}/images/edits`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${model.apiKey}` },
      body: form,
    },
    timeoutMs,
  );
  return extractB64(json);
}
