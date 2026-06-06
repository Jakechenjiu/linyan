// JSON 字段解析器 — 安全解析 Character 模型中的 JSON 字段

import type { PersonalityVector, LanguageFingerprint, CharacterAgentState, BehaviorConstraints } from "./types";
import { DEFAULT_FINGERPRINT, DEFAULT_STATE, DEFAULT_CONSTRAINTS } from "./types";

/**
 * 解析大五人格向量
 */
export function parsePersonality(character: {
  openness?: number | null;
  conscientiousness?: number | null;
  extraversion?: number | null;
  agreeableness?: number | null;
  neuroticism?: number | null;
}): PersonalityVector | null {
  const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = character;

  // 如果所有维度都是 null，返回 null（未设定）
  if (openness == null && conscientiousness == null && extraversion == null && agreeableness == null && neuroticism == null) {
    return null;
  }

  return {
    openness: openness ?? 5,
    conscientiousness: conscientiousness ?? 5,
    extraversion: extraversion ?? 5,
    agreeableness: agreeableness ?? 5,
    neuroticism: neuroticism ?? 5,
  };
}

/**
 * 解析语言指纹
 */
export function parseFingerprint(character: { languageFingerprint?: string | null }): LanguageFingerprint {
  if (!character.languageFingerprint) return DEFAULT_FINGERPRINT;

  try {
    const parsed = JSON.parse(character.languageFingerprint);
    return {
      avgSentenceLength: parsed.avgSentenceLength ?? DEFAULT_FINGERPRINT.avgSentenceLength,
      vocabComplexity: parsed.vocabComplexity ?? DEFAULT_FINGERPRINT.vocabComplexity,
      dialectMarkers: Array.isArray(parsed.dialectMarkers) ? parsed.dialectMarkers : [],
      forbiddenWords: Array.isArray(parsed.forbiddenWords) ? parsed.forbiddenWords : [],
      signaturePhrases: Array.isArray(parsed.signaturePhrases) ? parsed.signaturePhrases : [],
      punctuationStyle: parsed.punctuationStyle ?? DEFAULT_FINGERPRINT.punctuationStyle,
      narrativeVoice: parsed.narrativeVoice ?? DEFAULT_FINGERPRINT.narrativeVoice,
    };
  } catch {
    return DEFAULT_FINGERPRINT;
  }
}

/**
 * 解析角色状态
 */
export function parseState(character: { agentState?: string | null }): CharacterAgentState {
  if (!character.agentState) return DEFAULT_STATE;

  try {
    const parsed = JSON.parse(character.agentState);
    return {
      location: parsed.location ?? DEFAULT_STATE.location,
      emotionalState: parsed.emotionalState ?? DEFAULT_STATE.emotionalState,
      primaryMotivation: parsed.primaryMotivation ?? DEFAULT_STATE.primaryMotivation,
      activeFear: parsed.activeFear ?? DEFAULT_STATE.activeFear,
      energyLevel: parsed.energyLevel ?? DEFAULT_STATE.energyLevel,
      relationshipChanges: typeof parsed.relationshipChanges === "object" ? parsed.relationshipChanges : {},
    };
  } catch {
    return DEFAULT_STATE;
  }
}

/**
 * 解析行为约束
 */
export function parseConstraints(character: { behaviorConstraints?: string | null }): BehaviorConstraints {
  if (!character.behaviorConstraints) return DEFAULT_CONSTRAINTS;

  try {
    const parsed = JSON.parse(character.behaviorConstraints);
    return {
      hardLimits: Array.isArray(parsed.hardLimits) ? parsed.hardLimits : [],
      softLimits: Array.isArray(parsed.softLimits) ? parsed.softLimits : [],
      triggers: Array.isArray(parsed.triggers) ? parsed.triggers : [],
      speechPatterns: {
        formality: parsed.speechPatterns?.formality ?? DEFAULT_CONSTRAINTS.speechPatterns.formality,
        verbosity: parsed.speechPatterns?.verbosity ?? DEFAULT_CONSTRAINTS.speechPatterns.verbosity,
        humor: parsed.speechPatterns?.humor ?? DEFAULT_CONSTRAINTS.speechPatterns.humor,
      },
    };
  } catch {
    return DEFAULT_CONSTRAINTS;
  }
}

/**
 * 序列化大五人格向量为 JSON 字符串
 */
export function serializePersonality(p: PersonalityVector | null): string | null {
  if (!p) return null;
  return JSON.stringify(p);
}

/**
 * 序列化语言指纹为 JSON 字符串
 */
export function serializeFingerprint(f: LanguageFingerprint): string {
  return JSON.stringify(f);
}

/**
 * 序列化角色状态为 JSON 字符串
 */
export function serializeState(s: CharacterAgentState): string {
  return JSON.stringify(s);
}

/**
 * 序列化行为约束为 JSON 字符串
 */
export function serializeConstraints(c: BehaviorConstraints): string {
  return JSON.stringify(c);
}
