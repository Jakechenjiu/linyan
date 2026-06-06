// 角色信息边界系统 — 精确追踪"谁知道什么"

import { prisma } from "@/lib/db";
import type { CharacterKnowledgeEntry } from "./types";

/**
 * 存储一条知识
 */
export async function storeKnowledge(
  characterId: string,
  data: {
    type: CharacterKnowledgeEntry["type"];
    content: string;
    source?: string;
    acquiredAt?: string;
    isSecret?: boolean;
  }
): Promise<CharacterKnowledgeEntry> {
  const entry = await prisma.characterKnowledge.create({
    data: {
      characterId,
      type: data.type,
      content: data.content,
      source: data.source,
      acquiredAt: data.acquiredAt,
      isSecret: data.isSecret ?? false,
    },
  });

  return {
    id: entry.id,
    characterId: entry.characterId,
    type: entry.type as CharacterKnowledgeEntry["type"],
    content: entry.content,
    source: entry.source || undefined,
    acquiredAt: entry.acquiredAt || undefined,
    isSecret: entry.isSecret,
    createdAt: entry.createdAt.toISOString(),
  };
}

/**
 * 检查角色是否知道某件事
 */
export async function doesCharacterKnow(
  characterId: string,
  fact: string
): Promise<boolean> {
  const count = await prisma.characterKnowledge.count({
    where: {
      characterId,
      content: { contains: fact },
    },
  });
  return count > 0;
}

/**
 * 查询角色的知识
 */
export async function queryKnowledge(
  characterId: string,
  options: {
    type?: CharacterKnowledgeEntry["type"];
    isSecret?: boolean;
    keywords?: string[];
    limit?: number;
  } = {}
): Promise<CharacterKnowledgeEntry[]> {
  const where: any = { characterId };
  if (options.type) where.type = options.type;
  if (options.isSecret !== undefined) where.isSecret = options.isSecret;

  const entries = await prisma.characterKnowledge.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options.limit || 50,
  });

  let results = entries.map((e) => ({
    id: e.id,
    characterId: e.characterId,
    type: e.type as CharacterKnowledgeEntry["type"],
    content: e.content,
    source: e.source || undefined,
    acquiredAt: e.acquiredAt || undefined,
    isSecret: e.isSecret,
    createdAt: e.createdAt.toISOString(),
  }));

  // 关键词过滤
  if (options.keywords && options.keywords.length > 0) {
    results = results.filter((e) =>
      options.keywords!.some((kw) => e.content.includes(kw))
    );
  }

  return results;
}

/**
 * 格式化知识为 prompt 注入文本（信息边界）
 */
export function formatKnowledgeForPrompt(
  knowledge: CharacterKnowledgeEntry[],
  language: "zh" | "en" = "zh"
): string {
  if (knowledge.length === 0) {
    return language === "en"
      ? "You don't have any specific knowledge about the current situation."
      : "你对当前情况没有特别的了解。";
  }

  const byType = {
    event: knowledge.filter((k) => k.type === "event"),
    secret: knowledge.filter((k) => k.type === "secret"),
    relationship: knowledge.filter((k) => k.type === "relationship"),
    world_fact: knowledge.filter((k) => k.type === "world_fact"),
  };

  const parts: string[] = [];

  if (language === "en") {
    if (byType.event.length > 0) {
      parts.push("Events you witnessed:\n" + byType.event.map((k) => `- ${k.content}`).join("\n"));
    }
    if (byType.secret.length > 0) {
      parts.push("Secrets you know:\n" + byType.secret.map((k) => `- ${k.content}`).join("\n"));
    }
    if (byType.relationship.length > 0) {
      parts.push("Relationship knowledge:\n" + byType.relationship.map((k) => `- ${k.content}`).join("\n"));
    }
    if (byType.world_fact.length > 0) {
      parts.push("World facts:\n" + byType.world_fact.map((k) => `- ${k.content}`).join("\n"));
    }
  } else {
    if (byType.event.length > 0) {
      parts.push("你经历过的事件：\n" + byType.event.map((k) => `- ${k.content}`).join("\n"));
    }
    if (byType.secret.length > 0) {
      parts.push("你知道的秘密：\n" + byType.secret.map((k) => `- ${k.content}`).join("\n"));
    }
    if (byType.relationship.length > 0) {
      parts.push("你对人际关系的了解：\n" + byType.relationship.map((k) => `- ${k.content}`).join("\n"));
    }
    if (byType.world_fact.length > 0) {
      parts.push("你知道的世界知识：\n" + byType.world_fact.map((k) => `- ${k.content}`).join("\n"));
    }
  }

  return parts.join("\n\n");
}

/**
 * 从章节中提取角色知识（调用 LLM）
 */
export async function extractKnowledgeFromChapter(
  characterId: string,
  characterName: string,
  chapterNumber: string,
  chapterBody: string,
  llmCall: (system: string, user: string) => Promise<string>
): Promise<Array<{
  type: CharacterKnowledgeEntry["type"];
  content: string;
  isSecret: boolean;
}>> {
  const system = `你是一位严谨的编辑。从章节正文中提取角色"${characterName}"获得的新知识。

只提取${characterName}亲眼所见、亲耳所闻或被告知的信息。不要提取${characterName}不可能知道的事。

返回严格 JSON 数组（不要 markdown 代码块）：
[
  {
    "type": "event|secret|relationship|world_fact",
    "content": "知识内容描述",
    "isSecret": true/false
  }
]

type 说明：
- event: 亲眼见证的事件
- secret: 被告知的秘密
- relationship: 对他人关系的新认知
- world_fact: 对世界的新理解

isSecret: 如果这是${characterName}被告知不要说出去的事，设为 true`;

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
 * 批量存储知识
 */
export async function batchStoreKnowledge(
  characterId: string,
  entries: Array<{
    type: CharacterKnowledgeEntry["type"];
    content: string;
    source?: string;
    acquiredAt?: string;
    isSecret?: boolean;
  }>
): Promise<void> {
  if (entries.length === 0) return;

  await prisma.characterKnowledge.createMany({
    data: entries.map((e) => ({
      characterId,
      type: e.type,
      content: e.content,
      source: e.source,
      acquiredAt: e.acquiredAt,
      isSecret: e.isSecret ?? false,
    })),
  });
}
