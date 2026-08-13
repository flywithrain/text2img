import { ImageResult } from "./types";

const KEY = "_history_v1";
const MAX_ITEMS = 60;

export function loadHistory(): ImageResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as ImageResult[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: ImageResult[]): void {
  if (typeof window === "undefined") return;
  const trimmed = items.slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // 超出配额：淘汰一半最旧记录后重试
    const half = trimmed.slice(0, Math.ceil(trimmed.length / 2));
    try {
      localStorage.setItem(KEY, JSON.stringify(half));
    } catch {
      /* 忽略：存储不可用时静默降级 */
    }
  }
}

export function addHistory(item: ImageResult): ImageResult[] {
  const next = [item, ...loadHistory()];
  saveHistory(next);
  return next;
}

export function removeHistory(id: string): ImageResult[] {
  const next = loadHistory().filter((i) => i.id !== id);
  saveHistory(next);
  return next;
}
