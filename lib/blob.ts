import { put, del, head } from "@vercel/blob";

const MAX_HISTORY = 100;

function toProxyUrl(pathname: string): string {
  return `/api/blob?path=${encodeURIComponent(pathname)}`;
}

function extractPathname(proxyUrl: string): string {
  try {
    let p: string;
    if (proxyUrl.startsWith("/api/blob?path=")) {
      p = decodeURIComponent(proxyUrl.replace("/api/blob?path=", ""));
    } else {
      // 兼容旧数据（可能是完整的 Blob URL 或 pathname）
      p = proxyUrl;
    }
    return p.startsWith("/") ? p : `/${p}`;
  } catch {
    return proxyUrl.startsWith("/") ? proxyUrl : `/${proxyUrl}`;
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
  if (!blob?.url) throw new Error("blob url missing");

  const res = await fetch(blob.url);
  if (!res.ok) {
    throw new Error(`blob fetch ${res.status}: ${res.statusText}`);
  }
  return {
    body: res.body,
    contentType: blob.contentType ?? res.headers.get("content-type"),
  };
}

export { MAX_HISTORY };
