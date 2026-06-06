// 灵砚缓存层 — 请求级 + TTL 缓存

import { getAllTruthFiles, type TruthFileType } from "./truth-files";

// ============ 真相文件缓存 ============

const truthFileCache = new Map<
  string,
  { data: Record<TruthFileType, string>; ts: number }
>();
const TRUTH_FILE_TTL = 60_000; // 1 分钟

export async function getCachedTruthFiles(
  novelId: string
): Promise<Record<TruthFileType, string>> {
  const cached = truthFileCache.get(novelId);
  if (cached && Date.now() - cached.ts < TRUTH_FILE_TTL) {
    return cached.data;
  }
  const data = await getAllTruthFiles(novelId);
  truthFileCache.set(novelId, { data, ts: Date.now() });
  return data;
}

export function invalidateTruthFileCache(novelId: string): void {
  truthFileCache.delete(novelId);
}

// ============ 用户配置缓存 ============

interface AiConfigCache {
  hasKey: boolean;
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  thinkingBudget: number;
  service?: string;
  configSource?: string;
  apiFormat?: string;
  stream?: boolean;
}

const configCache = new Map<
  string,
  { config: AiConfigCache; ts: number }
>();
const CONFIG_TTL = 5 * 60_000; // 5 分钟

export function getCachedAiConfig(userId: string): AiConfigCache | null {
  const cached = configCache.get(userId);
  if (cached && Date.now() - cached.ts < CONFIG_TTL) {
    return cached.config;
  }
  return null;
}

export function setCachedAiConfig(
  userId: string,
  config: AiConfigCache
): void {
  configCache.set(userId, { config, ts: Date.now() });
}

export function invalidateAiConfigCache(userId: string): void {
  configCache.delete(userId);
}

// ============ 小说数据缓存 ============

const novelCache = new Map<
  string,
  { data: any; ts: number }
>();
const NOVEL_TTL = 30_000; // 30 秒

export function getCachedNovel(novelId: string): any | null {
  const cached = novelCache.get(novelId);
  if (cached && Date.now() - cached.ts < NOVEL_TTL) {
    return cached.data;
  }
  return null;
}

export function setCachedNovel(novelId: string, data: any): void {
  novelCache.set(novelId, { data, ts: Date.now() });
}

export function invalidateNovelCache(novelId: string): void {
  novelCache.delete(novelId);
}

// ============ 清理过期缓存 ============

setInterval(() => {
  const now = Date.now();

  for (const [key, cached] of truthFileCache) {
    if (now - cached.ts > TRUTH_FILE_TTL * 2) {
      truthFileCache.delete(key);
    }
  }

  for (const [key, cached] of configCache) {
    if (now - cached.ts > CONFIG_TTL * 2) {
      configCache.delete(key);
    }
  }

  for (const [key, cached] of novelCache) {
    if (now - cached.ts > NOVEL_TTL * 2) {
      novelCache.delete(key);
    }
  }
}, 60_000); // 每分钟清理一次
