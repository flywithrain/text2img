import { EditParams, GenerateRequest, STEP_MODEL } from "./types";

const STEPFUN_BASE =
  process.env.STEPFUN_BASE_URL ?? "https://api.stepfun.com/step_plan/v1";
const TIMEOUT_MS = Number(process.env.STEPFUN_TIMEOUT_MS) || 60_000;

function extractB64(json: any): string {
  const b64 = json?.data?.[0]?.b64_json ?? json?.b64_json;
  if (!b64 || typeof b64 !== "string") {
    throw new Error("响应中未找到 b64_json 字段");
  }
  return b64;
}

function isAuthError(message: string): boolean {
  return /401|unauthor|invalid.*key|鉴权|未授权/i.test(message);
}

export async function generateImage(
  req: GenerateRequest,
  timeoutMs = TIMEOUT_MS,
): Promise<string> {
  const apiKey = process.env.STEP_API_KEY;
  if (!apiKey) throw new Error("服务端未配置 STEP_API_KEY");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${STEPFUN_BASE}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`StepFun 返回 ${res.status}: ${text.slice(0, 300)}`);
    }
    return extractB64(await res.json());
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error("请求超时（60s）");
    if (isAuthError(e?.message ?? "")) throw new Error("鉴权失败：请检查 STEP_API_KEY 是否有效");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function editImage(
  params: EditParams,
  timeoutMs = TIMEOUT_MS,
): Promise<string> {
  const apiKey = process.env.STEP_API_KEY;
  if (!apiKey) throw new Error("服务端未配置 STEP_API_KEY");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const form = new FormData();
    form.append("model", STEP_MODEL);
    form.append("image", params.image);
    form.append("prompt", params.prompt);
    form.append("response_format", "b64_json");
    if (params.cfg_scale !== undefined)
      form.append("cfg_scale", String(params.cfg_scale));
    if (params.steps !== undefined) form.append("steps", String(params.steps));
    if (params.seed !== undefined) form.append("seed", String(params.seed));
    if (params.text_mode !== undefined)
      form.append("text_mode", String(params.text_mode));

    const res = await fetch(`${STEPFUN_BASE}/images/edits`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`StepFun 返回 ${res.status}: ${text.slice(0, 300)}`);
    }
    return extractB64(await res.json());
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error("请求超时（60s）");
    if (isAuthError(e?.message ?? "")) throw new Error("鉴权失败：请检查 STEP_API_KEY 是否有效");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
