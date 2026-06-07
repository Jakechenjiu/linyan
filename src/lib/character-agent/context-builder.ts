// 角色 Agent 上下文构建器 — 组装 prompt 注入文本

import { prisma } from "@/lib/db";
import { formatPersonalityDescription } from "./personality";
import { recallMemories, formatMemoriesForPrompt } from "./memory";
import { queryKnowledge, formatKnowledgeForPrompt } from "./knowledge";
import { parsePersonality, parseFingerprint, parseState, parseConstraints } from "./parsers";
import type { CharacterAgentData, PersonalityVector, LanguageFingerprint, CharacterAgentState, BehaviorConstraints } from "./types";

// 角色 Agent 缓存
const agentCache = new Map<string, { data: CharacterAgentData | null; ts: number }>();
const AGENT_CACHE_TTL = 60_000; // 1 分钟

/**
 * 加载角色 Agent 完整数据（带缓存）
 */
export async function loadCharacterAgent(
  characterId: string
): Promise<CharacterAgentData | null> {
  // 检查缓存
  const cached = agentCache.get(characterId);
  if (cached && Date.now() - cached.ts < AGENT_CACHE_TTL) {
    return cached.data;
  }

  const data = await loadCharacterAgentFromDb(characterId);
  agentCache.set(characterId, { data, ts: Date.now() });
  return data;
}

/**
 * 从数据库加载角色 Agent 完整数据
 */
async function loadCharacterAgentFromDb(
  characterId: string
): Promise<CharacterAgentData | null> {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: {
      memories: { orderBy: { importance: "desc" }, take: 20 },
      knowledge: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });

  if (!character) return null;

  return {
    id: character.id,
    name: character.name,
    role: character.role,
    tagline: character.tagline || undefined,
    appearance: character.appearance || undefined,
    personalityText: character.personality || undefined,
    desire: character.desire || undefined,
    flaw: character.flaw || undefined,
    wound: character.wound || undefined,
    need: character.need || undefined,
    change: character.change || undefined,
    goldenFinger: character.goldenFinger || undefined,
    personality: parsePersonality(character),
    languageFingerprint: parseFingerprint(character),
    agentState: parseState(character),
    behaviorConstraints: parseConstraints(character),
    memories: character.memories.map((m) => ({
      id: m.id,
      characterId: m.characterId,
      type: m.type as any,
      content: m.content,
      importance: m.importance,
      emotionTag: m.emotionTag || undefined,
      tags: JSON.parse(m.tags || "[]"),
      chapterId: m.chapterId || undefined,
      createdAt: m.createdAt.toISOString(),
    })),
    knowledge: character.knowledge.map((k) => ({
      id: k.id,
      characterId: k.characterId,
      type: k.type as any,
      content: k.content,
      source: k.source || undefined,
      acquiredAt: k.acquiredAt || undefined,
      isSecret: k.isSecret,
      createdAt: k.createdAt.toISOString(),
    })),
  };
}

/**
 * 构建角色 Agent 的 prompt 上下文
 */
export function buildCharacterAgentContext(
  agent: CharacterAgentData,
  language: "zh" | "en" = "zh"
): string {
  const parts: string[] = [];

  // 基本信息
  if (language === "zh") {
    parts.push(`## 角色：${agent.name}`);
    if (agent.tagline) parts.push(`称号：${agent.tagline}`);
    if (agent.role) parts.push(`角色定位：${agent.role}`);
  } else {
    parts.push(`## Character: ${agent.name}`);
    if (agent.tagline) parts.push(`Title: ${agent.tagline}`);
    if (agent.role) parts.push(`Role: ${agent.role}`);
  }

  // 性格
  if (agent.personality) {
    const desc = formatPersonalityDescription(agent.personality, language);
    if (language === "zh") {
      parts.push(`\n### 性格特征\n${desc}`);
    } else {
      parts.push(`\n### Personality\n${desc}`);
    }
  } else if (agent.personalityText) {
    if (language === "zh") {
      parts.push(`\n### 性格\n${agent.personalityText}`);
    } else {
      parts.push(`\n### Personality\n${agent.personalityText}`);
    }
  }

  // 语言指纹
  const fp = agent.languageFingerprint;
  if (fp.avgSentenceLength > 0 || fp.signaturePhrases.length > 0 || fp.forbiddenWords.length > 0) {
    if (language === "zh") {
      const fpParts: string[] = [];
      if (fp.avgSentenceLength > 0) fpParts.push(`平均句长：${fp.avgSentenceLength}字`);
      if (fp.vocabComplexity !== "moderate") fpParts.push(`用词：${fp.vocabComplexity === "simple" ? "简单直白" : "文学性强"}`);
      if (fp.signaturePhrases.length > 0) fpParts.push(`口头禅：${fp.signaturePhrases.join("、")}`);
      if (fp.forbiddenWords.length > 0) fpParts.push(`绝不说：${fp.forbiddenWords.join("、")}`);
      if (fp.dialectMarkers.length > 0) fpParts.push(`方言特征：${fp.dialectMarkers.join("、")}`);
      parts.push(`\n### 说话方式\n${fpParts.join("；")}`);
    } else {
      const fpParts: string[] = [];
      if (fp.avgSentenceLength > 0) fpParts.push(`avg sentence length: ${fp.avgSentenceLength} chars`);
      if (fp.signaturePhrases.length > 0) fpParts.push(`signature phrases: ${fp.signaturePhrases.join(", ")}`);
      if (fp.forbiddenWords.length > 0) fpParts.push(`never says: ${fp.forbiddenWords.join(", ")}`);
      parts.push(`\n### Speech Style\n${fpParts.join("; ")}`);
    }
  }

  // 当前状态
  const state = agent.agentState;
  if (state.emotionalState || state.primaryMotivation || state.location) {
    if (language === "zh") {
      const stateParts: string[] = [];
      if (state.location) stateParts.push(`位置：${state.location}`);
      if (state.emotionalState) stateParts.push(`情绪：${state.emotionalState}`);
      if (state.primaryMotivation) stateParts.push(`当前目标：${state.primaryMotivation}`);
      if (state.activeFear) stateParts.push(`当前恐惧：${state.activeFear}`);
      parts.push(`\n### 当前状态\n${stateParts.join("；")}`);
    } else {
      const stateParts: string[] = [];
      if (state.location) stateParts.push(`location: ${state.location}`);
      if (state.emotionalState) stateParts.push(`emotion: ${state.emotionalState}`);
      if (state.primaryMotivation) stateParts.push(`goal: ${state.primaryMotivation}`);
      if (state.activeFear) stateParts.push(`fear: ${state.activeFear}`);
      parts.push(`\n### Current State\n${stateParts.join("; ")}`);
    }
  }

  // 行为约束
  const constraints = agent.behaviorConstraints;
  if (constraints.hardLimits.length > 0 || constraints.triggers.length > 0) {
    if (language === "zh") {
      if (constraints.hardLimits.length > 0) {
        parts.push(`\n### 绝对不会做的事\n${constraints.hardLimits.map((l) => `- ${l}`).join("\n")}`);
      }
      if (constraints.triggers.length > 0) {
        parts.push(`\n### 触发强烈反应的事\n${constraints.triggers.map((t) => `- ${t}`).join("\n")}`);
      }
    } else {
      if (constraints.hardLimits.length > 0) {
        parts.push(`\n### Hard Limits\n${constraints.hardLimits.map((l) => `- ${l}`).join("\n")}`);
      }
      if (constraints.triggers.length > 0) {
        parts.push(`\n### Triggers\n${constraints.triggers.map((t) => `- ${t}`).join("\n")}`);
      }
    }
  }

  // 记忆
  if (agent.memories.length > 0) {
    const memoryText = formatMemoriesForPrompt(agent.memories, language);
    if (memoryText) {
      if (language === "zh") {
        parts.push(`\n### 你的记忆\n${memoryText}`);
      } else {
        parts.push(`\n### Your Memories\n${memoryText}`);
      }
    }
  }

  // 信息边界
  if (agent.knowledge.length > 0) {
    const knowledgeText = formatKnowledgeForPrompt(agent.knowledge, language);
    if (knowledgeText) {
      parts.push(`\n${knowledgeText}`);
    }
  }

  return parts.join("\n");
}

/**
 * 构建多角色上下文（用于场景生成）
 */
export async function buildMultiCharacterContext(
  characterIds: string[],
  language: "zh" | "en" = "zh"
): Promise<string> {
  const contexts: string[] = [];

  for (const id of characterIds) {
    const agent = await loadCharacterAgent(id);
    if (agent) {
      contexts.push(buildCharacterAgentContext(agent, language));
    }
  }

  return contexts.join("\n\n---\n\n");
}
