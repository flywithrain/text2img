import { put, del } from "@vercel/blob";

const MAX_HISTORY = 100;

export async function uploadImage(
  b64: string,
  filename: string,
): Promise<string> {
  const buffer = Buffer.from(b64, "base64");
  const blob = await put(filename, buffer, {
    access: "public",
    contentType: "image/png",
  });
  return blob.url;
}

export async function deleteImage(url: string): Promise<void> {
  try {
    await del(url);
  } catch (e) {
    console.error("blob delete failed:", e);
  }
}

export { MAX_HISTORY };
