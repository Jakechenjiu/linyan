// 灵砚缓存层 — LRU + TTL 缓存，防止无限膨胀

import { getAllTruthFiles, type TruthFileType } from "./truth-files";
import { LRUCache } from "./cache-lru";

// ============ 真相文件缓存 (1分钟TTL, 最多200条) ============

const truthFileCache = new LRUCache<string, Record<TruthFileType, string>>(200, 60_000);

export async function getCachedTruthFiles(
  novelId: string
): Promise<Record<TruthFileType, string>> {
  const cached = truthFileCache.get(novelId);
  if (cached) return cached;

  const data = await getAllTruthFiles(novelId);
  truthFileCache.set(novelId, data);
  return data;
}

export function invalidateTruthFileCache(novelId: string): void {
  truthFileCache.delete(novelId);
}

// ============ 用户配置缓存 (5分钟TTL, 最多500条) ============

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

const configCache = new LRUCache<string, AiConfigCache>(500, 5 * 60_000);

export function getCachedAiConfig(userId: string): AiConfigCache | null {
  return configCache.get(userId) ?? null;
}

export function setCachedAiConfig(
  userId: string,
  config: AiConfigCache
): void {
  configCache.set(userId, config);
}

export function invalidateAiConfigCache(userId: string): void {
  configCache.delete(userId);
}

// ============ 小说数据缓存 (30秒TTL, 最多100条) ============

const novelCache = new LRUCache<string, any>(100, 30_000);

export function getCachedNovel(novelId: string): any | null {
  return novelCache.get(novelId) ?? null;
}

export function setCachedNovel(novelId: string, data: any): void {
  novelCache.set(novelId, data);
}

export function invalidateNovelCache(novelId: string): void {
  novelCache.delete(novelId);
}

// ============ 定期清理（LRU 自带 TTL 淘汰，这里做额外清理） ============

setInterval(() => {
  truthFileCache.cleanup();
  configCache.cleanup();
  novelCache.cleanup();
}, 60_000);
