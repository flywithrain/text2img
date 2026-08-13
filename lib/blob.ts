import { put, del, head } from "@vercel/blob";

const MAX_HISTORY = 100;

function toProxyUrl(pathname: string): string {
  return `/api/blob?path=${encodeURIComponent(pathname)}`;
}

function extractPathname(proxyUrl: string): string {
  try {
    if (proxyUrl.startsWith("/api/blob?path=")) {
      return decodeURIComponent(proxyUrl.replace("/api/blob?path=", ""));
    }
    // 兼容旧数据（可能是完整的 Blob URL 或 pathname）
    return proxyUrl;
  } catch {
    return proxyUrl;
  }
}

export async function uploadImage(
  b64: string,
  filename: string,
): Promise<string> {
  const buffer = Buffer.from(b64, "base64");
  const blob = await put(filename, buffer, {
    access: "private",
    contentType: "image/png",
  });
  return toProxyUrl(blob.pathname);
}

export async function deleteImage(proxyUrl: string): Promise<void> {
  try {
    const pathname = extractPathname(proxyUrl);
    await del(pathname);
  } catch (e) {
    console.error("blob delete failed:", e);
  }
}

export async function readBlob(pathname: string): Promise<{
  body: ReadableStream<Uint8Array> | null;
  contentType: string | null;
}> {
  const blob = await head(pathname);
  const res = await fetch(blob.url);
  return {
    body: res.body,
    contentType: blob.contentType ?? res.headers.get("content-type"),
  };
}

export { MAX_HISTORY };
