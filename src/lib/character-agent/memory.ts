// 角色记忆系统 — 存储、检索、遗忘

import { prisma } from "@/lib/db";
import type { CharacterMemoryEntry } from "./types";

/**
 * 存储一条记忆
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

/**
 * 检索角色记忆（基于重要性 + 时间衰减）
 */
export async function recallMemories(
  characterId: string,
  options: {
    type?: CharacterMemoryEntry["type"];
    keywords?: string[];
    minImportance?: number;
    limit?: number;
  } = {}
): Promise<CharacterMemoryEntry[]> {
  const { type, keywords, minImportance = 0.3, limit = 20 } = options;

  const where: any = {
    characterId,
    importance: { gte: minImportance },
  };

  if (type) {
    where.type = type;
  }

  const memories = await prisma.characterMemory.findMany({
    where,
    orderBy: { importance: "desc" },
    take: limit,
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
      keywords.some((kw) => m.content.includes(kw) || m.tags.some((t) => t.includes(kw)))
    );
  }

  return results;
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
