// 角色记忆系统 — 存储、检索、遗忘

import { prisma } from "@/lib/db";
import type { CharacterMemoryEntry } from "./types";

/**
 * 存储一条记忆（自动去重）
 */
export async function storeMemory(
  characterId: string,
  data: {
    type: CharacterMemoryEntry["type"];
    content: string;
    importance?: number;
    emotionTag?: string;
    tags?: string[];
    chapterId?: string;
  }
): Promise<CharacterMemoryEntry> {
  // 检查是否已存在相同内容的记忆
  const existing = await prisma.characterMemory.findFirst({
    where: {
      characterId,
      content: data.content,
    },
  });

  if (existing) {
    // 已存在，更新重要性（取较高值）
    const updated = await prisma.characterMemory.update({
      where: { id: existing.id },
      data: {
        importance: Math.max(existing.importance, data.importance ?? 0.5),
        emotionTag: data.emotionTag || existing.emotionTag,
      },
    });
    return {
      id: updated.id,
      characterId: updated.characterId,
      type: updated.type as CharacterMemoryEntry["type"],
      content: updated.content,
      importance: updated.importance,
      emotionTag: updated.emotionTag || undefined,
      tags: JSON.parse(updated.tags || "[]"),
      chapterId: updated.chapterId || undefined,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  const memory = await prisma.characterMemory.create({
    data: {
      characterId,
      type: data.type,
      content: data.content,
      importance: data.importance ?? 0.5,
      emotionTag: data.emotionTag,
      tags: JSON.stringify(data.tags || []),
      chapterId: data.chapterId,
    },
  });

  return {
    id: memory.id,
    characterId: memory.characterId,
    type: memory.type as CharacterMemoryEntry["type"],
    content: memory.content,
    importance: memory.importance,
    emotionTag: memory.emotionTag || undefined,
    tags: JSON.parse(memory.tags || "[]"),
    chapterId: memory.chapterId || undefined,
    createdAt: memory.createdAt.toISOString(),
  };
}

// 记忆衰减常数 — 10 章半衰期
const DECAY_HALF_LIFE = 10
const DECAY_LAMBDA = Math.LN2 / DECAY_HALF_LIFE

/**
 * 检索角色记忆（基于重要性 + 章节衰减）
 * 使用 Stanford Generative Agents 的衰减模型：
 * effectiveScore = exp(-λ * chaptersAgo) * (0.3 + 0.7 * importance)
 */
export async function recallMemories(
  characterId: string,
  options: {
    type?: CharacterMemoryEntry["type"];
    keywords?: string[];
    minImportance?: number;
    currentChapter?: number;
    limit?: number;
  } = {}
): Promise<CharacterMemoryEntry[]> {
  const { type, keywords, minImportance = 0.3, currentChapter, limit = 10 } = options;

  const where: any = {
    characterId,
    importance: { gte: minImportance },
  };

  if (type) {
    where.type = type;
  }

  // 多取一些，衰减后裁剪
  const fetchLimit = currentChapter ? limit * 3 : limit
  const memories = await prisma.characterMemory.findMany({
    where,
    orderBy: { importance: "desc" },
    take: fetchLimit,
  });

  let results = memories.map((m) => ({
    id: m.id,
    characterId: m.characterId,
    type: m.type as CharacterMemoryEntry["type"],
    content: m.content,
    importance: m.importance,
    emotionTag: m.emotionTag || undefined,
    tags: JSON.parse(m.tags || "[]"),
    chapterId: m.chapterId || undefined,
    createdAt: m.createdAt.toISOString(),
  }));

  // 关键词过滤
  if (keywords && keywords.length > 0) {
    results = results.filter((m) =>
      keywords.some((kw) => m.content.includes(kw) || m.tags.some((t: string) => t.includes(kw)))
    );
  }

  // 章节衰减排序
  if (currentChapter) {
    const scored = results.map((m) => {
      // 从 chapterId 推断章节号（简化：用 createdAt 的时间顺序近似）
      const chaptersAgo = estimateChaptersAgo(m.createdAt, currentChapter)
      const recencyFactor = Math.exp(-DECAY_LAMBDA * chaptersAgo)
      const importanceFactor = m.importance / 10
      const effectiveScore = recencyFactor * (0.3 + 0.7 * importanceFactor)
      return { ...m, effectiveScore }
    })
    scored.sort((a, b) => b.effectiveScore - a.effectiveScore)
    return scored.slice(0, limit)
  }

  return results.slice(0, limit)
}

/** 估算记忆距今多少章（基于 createdAt 的天数差近似） */
function estimateChaptersAgo(createdAt: string, currentChapter: number): number {
  const created = new Date(createdAt).getTime()
  const now = Date.now()
  const daysAgo = (now - created) / (1000 * 60 * 60 * 24)
  // 假设每天写 1-2 章，保守估计
  return Math.max(0, Math.round(daysAgo * 1.5))
}

/**
 * 格式化记忆为 prompt 注入文本
 */
export function formatMemoriesForPrompt(
  memories: CharacterMemoryEntry[],
  language: "zh" | "en" = "zh"
): string {
  if (memories.length === 0) return "";

  const sorted = [...memories].sort((a, b) => b.importance - a.importance);

  if (language === "en") {
    return sorted
      .map((m) => {
        const tags = m.tags.length > 0 ? ` [${m.tags.join(", ")}]` : "";
        const emotion = m.emotionTag ? ` (${m.emotionTag})` : "";
        return `- ${m.content}${emotion}${tags}`;
      })
      .join("\n");
  }

  return sorted
    .map((m) => {
      const tags = m.tags.length > 0 ? ` [${m.tags.join("、")}]` : "";
      const emotion = m.emotionTag ? ` (${m.emotionTag})` : "";
      return `- ${m.content}${emotion}${tags}`;
    })
    .join("\n");
}

/**
 * 从章节中提取角色记忆（调用 LLM）
 */
export async function extractMemoriesFromChapter(
  characterId: string,
  characterName: string,
  chapterId: string,
  chapterBody: string,
  llmCall: (system: string, user: string) => Promise<string>
): Promise<Array<{ type: CharacterMemoryEntry["type"]; content: string; importance: number; emotionTag?: string }>> {
  const system = `你是一位严谨的编辑。从章节正文中提取与角色"${characterName}"相关的记忆。

返回严格 JSON 数组（不要 markdown 代码块）：
[
  {
    "type": "experience|observation|emotion|knowledge",
    "content": "记忆内容描述",
    "importance": 0.0-1.0,
    "emotionTag": "情感标签（可选）"
  }
]

type 说明：
- experience: 角色亲身经历的事件
- observation: 角色观察到的事情
- emotion: 角色的情感体验
- knowledge: 角色获得的新知识

importance 说明：
- 0.9-1.0: 重大转折点、创伤、关键决策
- 0.7-0.8: 重要事件、关系变化
- 0.5-0.6: 普通事件
- 0.1-0.4: 琐碎细节

只提取与"${characterName}"直接相关的记忆。不要编造。`;

  const user = `章节内容：\n${chapterBody.slice(0, 6000)}`;

  try {
    const result = await llmCall(system, user);
    const parsed = JSON.parse(result.replace(/```json\s?|\```/g, "").trim());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * 批量存储记忆
 */
export async function batchStoreMemories(
  characterId: string,
  memories: Array<{
    type: CharacterMemoryEntry["type"];
    content: string;
    importance: number;
    emotionTag?: string;
    chapterId?: string;
  }>
): Promise<void> {
  if (memories.length === 0) return;

  await prisma.characterMemory.createMany({
    data: memories.map((m) => ({
      characterId,
      type: m.type,
      content: m.content,
      importance: m.importance,
      emotionTag: m.emotionTag,
      tags: "[]",
      chapterId: m.chapterId,
    })),
  });
}
