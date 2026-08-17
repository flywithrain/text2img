import type { ModelProvider } from "@/lib/types";
import type { ImageModel } from "@prisma/client";

const PROVIDERS: ModelProvider[] = ["stepfun", "openai", "gemini"];

export interface ParsedModelInput {
  name: string;
  provider: ModelProvider;
  model: string;
  baseUrl: string;
  apiKey?: string;
  enabled: boolean;
  isDefault: boolean;
}

/** 校验并归一化模型管理入参，返回错误信息或 null */
export function parseModelInput(
  body: any,
): { data?: ParsedModelInput; error?: string } {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const model = typeof body?.model === "string" ? body.model.trim() : "";
  const baseUrl =
    typeof body?.baseUrl === "string" ? body.baseUrl.trim() : "";
  const provider = body?.provider as ModelProvider;

  if (!name) return { error: "模型名称不能为空" };
  if (!PROVIDERS.includes(provider))
    return { error: "provider 必须是 stepfun / openai / gemini" };
  if (!model) return { error: "模型标识不能为空" };
  if (!/^https?:\/\//.test(baseUrl))
    return { error: "API 地址必须以 http(s):// 开头" };
  if (body?.apiKey !== undefined && typeof body.apiKey !== "string")
    return { error: "API Key 格式不正确" };

  return {
    data: {
      name: name.slice(0, 50),
      provider,
      model: model.slice(0, 100),
      baseUrl: baseUrl.slice(0, 500),
      apiKey: body?.apiKey ? body.apiKey.trim() : undefined,
      enabled: body?.enabled !== false,
      isDefault: body?.isDefault === true,
    },
  };
}

/** 掩码显示 API Key，仅保留前后 4 位 */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}****${key.slice(-4)}`;
}

/** 管理端列表视图（含掩码密钥） */
export function toAdminView(row: ImageModel) {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    model: row.model,
    baseUrl: row.baseUrl,
    apiKeyMasked: maskApiKey(row.apiKey),
    hasApiKey: !!row.apiKey,
    enabled: row.enabled,
    isDefault: row.isDefault,
    createdAt: row.createdAt.toISOString(),
  };
}

/** 用户端列表视图（不含密钥） */
export function toPublicView(row: ImageModel) {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider as ModelProvider,
    model: row.model,
    isDefault: row.isDefault,
  };
}
