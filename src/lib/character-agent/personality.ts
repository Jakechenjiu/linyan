// 大五人格向量工具

import type { PersonalityVector, BehaviorTendency } from "./types";

/**
 * 从自然语言性格描述推导大五人格向量
 */
export function inferPersonalityFromText(
  personalityText: string,
  desire?: string,
  flaw?: string
): PersonalityVector {
  const text = `${personalityText || ""} ${desire || ""} ${flaw || ""}`.toLowerCase();

  // 基于关键词的简单推导
  const openness = estimateOpenness(text);
  const conscientiousness = estimateConscientiousness(text);
  const extraversion = estimateExtraversion(text);
  const agreeableness = estimateAgreeableness(text);
  const neuroticism = estimateNeuroticism(text);

  return { openness, conscientiousness, extraversion, agreeableness, neuroticism };
}

function estimateOpenness(text: string): number {
  let score = 5;
  // 高开放性信号
  if (/好奇|探索|创新|想象|创造|艺术|理想/.test(text)) score += 2;
  if (/冒险|尝试|新奇|独特|不拘一格/.test(text)) score += 1;
  // 低开放性信号
  if (/保守|传统|固执|守旧|循规蹈矩/.test(text)) score -= 2;
  if (/务实|现实|脚踏实地/.test(text)) score -= 1;
  return clamp(score);
}

function estimateConscientiousness(text: string): number {
  let score = 5;
  if (/自律|负责|计划|严谨|认真|勤奋|有条理/.test(text)) score += 2;
  if (/完美主义|一丝不苟/.test(text)) score += 1;
  if (/懒散|随意|散漫|马虎|不负责/.test(text)) score -= 2;
  if (/冲动|随性/.test(text)) score -= 1;
  return clamp(score);
}

function estimateExtraversion(text: string): number {
  let score = 5;
  if (/外向|热情|健谈|社交|活泼|开朗/.test(text)) score += 2;
  if (/领袖|魅力|感染力/.test(text)) score += 1;
  if (/内向|沉默|安静|孤僻|害羞|社恐/.test(text)) score -= 2;
  if (/独处|低调/.test(text)) score -= 1;
  return clamp(score);
}

function estimateAgreeableness(text: string): number {
  let score = 5;
  if (/善良|温柔|体贴|同情|包容|信任/.test(text)) score += 2;
  if (/乐于助人|善解人意/.test(text)) score += 1;
  if (/自私|冷酷|无情|残忍|刻薄|多疑/.test(text)) score -= 2;
  if (/强势|霸道/.test(text)) score -= 1;
  return clamp(score);
}

function estimateNeuroticism(text: string): number {
  let score = 5;
  if (/敏感|焦虑|多疑|情绪化|易怒|脆弱|自卑/.test(text)) score += 2;
  if (/不安|紧张|担忧/.test(text)) score += 1;
  if (/冷静|沉稳|淡定|坚强|自信|乐观/.test(text)) score -= 2;
  if (/从容|泰然/.test(text)) score -= 1;
  return clamp(score);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(10, Math.round(value)));
}

/**
 * 根据性格向量生成行为倾向
 */
export function generateBehaviorTendencies(
  personality: PersonalityVector,
  situation: string
): BehaviorTendency[] {
  const tendencies: BehaviorTendency[] = [];
  const sit = situation.toLowerCase();

  // 勇气相关
  if (/危险|威胁|战斗|冲突/.test(sit)) {
    if (personality.openness >= 7 && personality.neuroticism <= 4) {
      tendencies.push({
        action: "直面挑战",
        confidence: 0.8,
        reasoning: "高开放性 + 低神经质 = 勇于尝试",
      });
    }
    if (personality.neuroticism >= 7) {
      tendencies.push({
        action: "感到焦虑，可能退缩",
        confidence: 0.7,
        reasoning: "高神经质 = 情绪波动大",
      });
    }
  }

  // 社交相关
  if (/对话|交流|说服|谈判/.test(sit)) {
    if (personality.extraversion >= 7) {
      tendencies.push({
        action: "主动沟通，表达清晰",
        confidence: 0.8,
        reasoning: "高外向性 = 社交能量充足",
      });
    }
    if (personality.agreeableness >= 7) {
      tendencies.push({
        action: "寻求共识，避免冲突",
        confidence: 0.7,
        reasoning: "高宜人性 = 倾向合作",
      });
    }
  }

  // 决策相关
  if (/选择|决定|犹豫|权衡/.test(sit)) {
    if (personality.conscientiousness >= 7) {
      tendencies.push({
        action: "仔细分析，不急于决定",
        confidence: 0.8,
        reasoning: "高尽责性 = 计划性强",
      });
    }
    if (personality.openness >= 7) {
      tendencies.push({
        action: "考虑多种可能性",
        confidence: 0.7,
        reasoning: "高开放性 = 愿意探索",
      });
    }
  }

  // 情感相关
  if (/悲伤|失落|背叛|失去/.test(sit)) {
    if (personality.neuroticism >= 7) {
      tendencies.push({
        action: "情绪波动大，可能失控",
        confidence: 0.8,
        reasoning: "高神经质 = 情绪敏感",
      });
    }
    if (personality.agreeableness >= 7) {
      tendencies.push({
        action: "寻求他人安慰",
        confidence: 0.6,
        reasoning: "高宜人性 = 依赖他人",
      });
    }
  }

  // 如果没有匹配的倾向，给出默认
  if (tendencies.length === 0) {
    tendencies.push({
      action: "根据情境做出合理反应",
      confidence: 0.5,
      reasoning: "无明显性格倾向",
    });
  }

  return tendencies;
}

/**
 * 性格演化：经历重大事件后微调
 */
export function evolvePersonality(
  current: PersonalityVector,
  event: { type: string; impact: string; intensity: number }
): PersonalityVector {
  const delta = event.intensity * 0.1; // 最大调整 1 点

  const adjustments: Partial<PersonalityVector> = {};

  switch (event.type) {
    case "trauma":
      adjustments.neuroticism = delta;
      adjustments.agreeableness = -delta * 0.5;
      break;
    case "achievement":
      adjustments.extraversion = delta * 0.5;
      adjustments.conscientiousness = delta * 0.3;
      break;
    case "betrayal":
      adjustments.agreeableness = -delta;
      adjustments.neuroticism = delta * 0.5;
      break;
    case "love":
      adjustments.agreeableness = delta * 0.5;
      adjustments.neuroticism = delta * 0.3;
      break;
    case "loss":
      adjustments.neuroticism = delta;
      adjustments.extraversion = -delta * 0.3;
      break;
    default:
      break;
  }

  return {
    openness: clamp(current.openness + (adjustments.openness || 0)),
    conscientiousness: clamp(current.conscientiousness + (adjustments.conscientiousness || 0)),
    extraversion: clamp(current.extraversion + (adjustments.extraversion || 0)),
    agreeableness: clamp(current.agreeableness + (adjustments.agreeableness || 0)),
    neuroticism: clamp(current.neuroticism + (adjustments.neuroticism || 0)),
  };
}

/**
 * 检测两个角色的性格冲突程度
 */
export function detectPersonalityConflict(
  a: PersonalityVector,
  b: PersonalityVector
): { dimension: string; conflict: number }[] {
  const conflicts: { dimension: string; conflict: number }[] = [];

  // 外向性差异大 → 社交冲突
  const extravDiff = Math.abs(a.extraversion - b.extraversion);
  if (extravDiff >= 5) {
    conflicts.push({ dimension: "extraversion", conflict: extravDiff / 10 });
  }

  // 宜人性差异大 → 合作冲突
  const agreeDiff = Math.abs(a.agreeableness - b.agreeableness);
  if (agreeDiff >= 5) {
    conflicts.push({ dimension: "agreeableness", conflict: agreeDiff / 10 });
  }

  // 尽责性差异大 → 工作方式冲突
  const consDiff = Math.abs(a.conscientiousness - b.conscientiousness);
  if (consDiff >= 5) {
    conflicts.push({ dimension: "conscientiousness", conflict: consDiff / 10 });
  }

  return conflicts;
}

/**
 * 将性格向量格式化为自然语言描述
 */
export function formatPersonalityDescription(p: PersonalityVector, language: "zh" | "en" = "zh"): string {
  const parts: string[] = [];

  if (language === "zh") {
    if (p.openness >= 7) parts.push("好奇心强，喜欢探索新事物");
    else if (p.openness <= 3) parts.push("保守传统，不喜欢变化");

    if (p.conscientiousness >= 7) parts.push("自律严谨，做事有条理");
    else if (p.conscientiousness <= 3) parts.push("随性散漫，不喜欢被约束");

    if (p.extraversion >= 7) parts.push("外向健谈，社交能量充沛");
    else if (p.extraversion <= 3) parts.push("内向安静，更喜欢独处");

    if (p.agreeableness >= 7) parts.push("善良体贴，容易信任他人");
    else if (p.agreeableness <= 3) parts.push("冷酷多疑，不太在意他人感受");

    if (p.neuroticism >= 7) parts.push("情绪敏感，容易焦虑");
    else if (p.neuroticism <= 3) parts.push("冷静沉稳，不易受情绪影响");
  } else {
    if (p.openness >= 7) parts.push("curious and creative");
    else if (p.openness <= 3) parts.push("conservative and traditional");

    if (p.conscientiousness >= 7) parts.push("disciplined and organized");
    else if (p.conscientiousness <= 3) parts.push("casual and spontaneous");

    if (p.extraversion >= 7) parts.push("outgoing and talkative");
    else if (p.extraversion <= 3) parts.push("introverted and quiet");

    if (p.agreeableness >= 7) parts.push("kind and trusting");
    else if (p.agreeableness <= 3) parts.push("cold and suspicious");

    if (p.neuroticism >= 7) parts.push("emotionally sensitive");
    else if (p.neuroticism <= 3) parts.push("calm and stable");
  }

  return parts.join("；") || (language === "zh" ? "性格平衡" : "balanced personality");
}
