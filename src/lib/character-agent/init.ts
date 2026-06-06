// 角色 Agent 初始化 — 从现有 Character 数据生成 Agent 配置

import { prisma } from "@/lib/db";
import { inferPersonalityFromText } from "./personality";
import { DEFAULT_FINGERPRINT, DEFAULT_STATE, DEFAULT_CONSTRAINTS } from "./types";
import { serializePersonality, serializeFingerprint, serializeState, serializeConstraints } from "./parsers";
import type { LanguageFingerprint, BehaviorConstraints } from "./types";

/**
 * 为单个角色初始化 Agent 数据
 */
export async function initializeCharacterAgent(characterId: string): Promise<void> {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
  });

  if (!character) throw new Error("Character not found");

  // 跳过已有 Agent 数据的角色
  if (character.openness != null) return;

  // 从自然语言推导大五人格
  const personality = inferPersonalityFromText(
    character.personality || "",
    character.desire || "",
    character.flaw || ""
  );

  // 构建语言指纹（基于角色类型）
  const fingerprint = buildDefaultFingerprint(character);

  // 构建行为约束
  const constraints = buildDefaultConstraints(character);

  // 更新 Character 记录
  await prisma.character.update({
    where: { id: characterId },
    data: {
      openness: personality.openness,
      conscientiousness: personality.conscientiousness,
      extraversion: personality.extraversion,
      agreeableness: personality.agreeableness,
      neuroticism: personality.neuroticism,
      languageFingerprint: serializeFingerprint(fingerprint),
      agentState: serializeState(DEFAULT_STATE),
      behaviorConstraints: serializeConstraints(constraints),
    },
  });
}

/**
 * 为小说中的所有角色初始化 Agent 数据
 */
export async function initializeAllCharacterAgents(novelId: string): Promise<number> {
  const characters = await prisma.character.findMany({
    where: { novelId },
  });

  let count = 0;
  for (const character of characters) {
    // 跳过已有 Agent 数据的角色
    if (character.openness != null) continue;

    await initializeCharacterAgent(character.id);
    count++;
  }

  return count;
}

/**
 * 构建默认语言指纹（基于角色类型）
 */
function buildDefaultFingerprint(character: {
  name: string;
  role: string;
  personality?: string | null;
}): LanguageFingerprint {
  const p = (character.personality || "").toLowerCase();

  // 基于角色类型调整默认值
  let avgSentenceLength = 20;
  let vocabComplexity: "simple" | "moderate" | "complex" = "moderate";
  let formality = 5;

  switch (character.role) {
    case "protagonist":
      avgSentenceLength = 18;
      vocabComplexity = "moderate";
      break;
    case "antagonist":
      avgSentenceLength = 22;
      vocabComplexity = "complex";
      formality = 7;
      break;
    case "mentor":
      avgSentenceLength = 25;
      vocabComplexity = "complex";
      formality = 8;
      break;
    case "love_interest":
      avgSentenceLength = 16;
      vocabComplexity = "moderate";
      break;
    default:
      avgSentenceLength = 20;
      vocabComplexity = "moderate";
  }

  // 基于性格调整
  if (/粗鲁|野蛮|暴躁/.test(p)) {
    avgSentenceLength = 12;
    vocabComplexity = "simple";
    formality = 2;
  }
  if (/文雅|书卷气|学者/.test(p)) {
    avgSentenceLength = 30;
    vocabComplexity = "complex";
    formality = 8;
  }

  return {
    ...DEFAULT_FINGERPRINT,
    avgSentenceLength,
    vocabComplexity,
  };
}

/**
 * 构建默认行为约束（基于角色设定）
 */
function buildDefaultConstraints(character: {
  personality?: string | null;
  desire?: string | null;
  flaw?: string | null;
  wound?: string | null;
}): BehaviorConstraints {
  const hardLimits: string[] = [];
  const softLimits: string[] = [];
  const triggers: string[] = [];

  const p = (character.personality || "").toLowerCase();
  const w = (character.wound || "").toLowerCase();

  // 基于性格生成约束
  if (/善良|仁慈/.test(p)) {
    hardLimits.push("不会主动伤害无辜的人");
  }
  if (/忠诚|信守承诺/.test(p)) {
    hardLimits.push("不会背叛信任自己的人");
  }
  if (/胆小|懦弱/.test(p)) {
    softLimits.push("避免直接冲突");
  }

  // 基于创伤生成触发器
  if (w) {
    triggers.push(`与"${character.wound}"相关的场景`);
  }

  return {
    hardLimits,
    softLimits,
    triggers,
    speechPatterns: DEFAULT_CONSTRAINTS.speechPatterns,
  };
}
