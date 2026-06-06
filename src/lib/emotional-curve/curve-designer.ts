// 情感曲线设计器 — AI 根据大纲+前文生成目标曲线

import type { EmotionalDataPoint, EmotionalCurveDesign, NarrativeTechnique } from "./types";
import { selectTechniques, EMOTIONAL_DIMENSIONS } from "./dimensions";

/**
 * 生成默认曲线（基于章节位置）
 */
export function generateDefaultCurve(
  chapterNumber: number,
  totalChapters: number,
  chapterType?: "setup" | "escalation" | "climax" | "aftermath"
): EmotionalDataPoint[] {
  // 基于章节位置生成默认曲线
  const position = chapterNumber / Math.max(totalChapters, 1);

  // 5 个数据点：开头、1/4、中间、3/4、结尾
  const points: EmotionalDataPoint[] = [
    { position: 0, tension: 3, suspense: 4, pleasure: 3, sadness: 2, reversal: 1 },
    { position: 25, tension: 5, suspense: 5, pleasure: 3, sadness: 2, reversal: 2 },
    { position: 50, tension: 6, suspense: 6, pleasure: 4, sadness: 3, reversal: 3 },
    { position: 75, tension: 8, suspense: 7, pleasure: 3, sadness: 4, reversal: 5 },
    { position: 100, tension: 5, suspense: 4, pleasure: 5, sadness: 3, reversal: 6 },
  ];

  // 根据章节类型调整
  switch (chapterType) {
    case "setup":
      points.forEach((p) => {
        p.tension = Math.max(1, p.tension - 2);
        p.suspense = Math.max(2, p.suspense - 1);
        p.pleasure = Math.min(6, p.pleasure + 1);
      });
      break;
    case "escalation":
      points.forEach((p) => {
        p.tension = Math.min(10, p.tension + 2);
        p.suspense = Math.min(10, p.suspense + 1);
      });
      break;
    case "climax":
      points.forEach((p) => {
        p.tension = Math.min(10, p.tension + 3);
        p.reversal = Math.min(10, p.reversal + 3);
      });
      break;
    case "aftermath":
      points.forEach((p) => {
        p.tension = Math.max(1, p.tension - 3);
        p.sadness = Math.min(8, p.sadness + 2);
        p.pleasure = Math.min(6, p.pleasure + 1);
      });
      break;
  }

  // 根据故事阶段调整（前期低，后期高）
  if (position < 0.2) {
    points.forEach((p) => {
      p.tension = Math.max(1, p.tension - 1);
      p.reversal = Math.max(1, p.reversal - 1);
    });
  } else if (position > 0.8) {
    points.forEach((p) => {
      p.tension = Math.min(10, p.tension + 1);
      p.reversal = Math.min(10, p.reversal + 1);
    });
  }

  return points;
}

/**
 * 根据用户描述生成曲线
 */
export async function generateCurveFromDescription(
  description: string,
  llmCall: (system: string, user: string) => Promise<string>
): Promise<EmotionalCurveDesign> {
  const system = `你是一位专业的叙事设计师。根据用户对本章情感目标的描述，生成情感曲线。

输出严格 JSON（不要 markdown 代码块）：
{
  "targetCurve": [
    {"position": 0, "tension": 0-10, "suspense": 0-10, "pleasure": 0-10, "sadness": 0-10, "reversal": 0-10},
    {"position": 25, ...},
    {"position": 50, ...},
    {"position": 75, ...},
    {"position": 100, ...}
  ],
  "techniques": [
    {"segment": [0, 30], "technique": "手段名称", "reason": "为什么选这个", "expectedEffect": "预期效果"}
  ],
  "overallTone": "整体基调描述",
  "pacingStrategy": "节奏策略描述"
}

维度说明：
- tension: 紧张度（0=完全放松，10=极度紧张）
- suspense: 悬念度（0=无悬念，10=极度好奇）
- pleasure: 愉悦度（0=无愉悦，10=极度满足）
- sadness: 悲伤度（0=无悲伤，10=极度心痛）
- reversal: 反转度（0=无意外，10=极度震惊）`;

  const user = `本章情感目标：${description}`;

  try {
    const result = await llmCall(system, user);
    const parsed = JSON.parse(result.replace(/```json\s?|\```/g, "").trim());
    return {
      targetCurve: parsed.targetCurve || generateDefaultCurve(1, 100),
      techniques: parsed.techniques || [],
      overallTone: parsed.overallTone || "",
      pacingStrategy: parsed.pacingStrategy || "",
    };
  } catch {
    return {
      targetCurve: generateDefaultCurve(1, 100),
      techniques: [],
      overallTone: "balanced",
      pacingStrategy: "standard pacing",
    };
  }
}

/**
 * 将曲线格式化为 prompt 注入文本
 */
export function formatCurveForPrompt(
  curve: EmotionalDataPoint[],
  techniques: NarrativeTechnique[],
  language: "zh" | "en" = "zh"
): string {
  const parts: string[] = [];

  if (language === "zh") {
    parts.push("## 情感曲线目标");
    parts.push("| 位置 | 紧张 | 悬念 | 愉悦 | 悲伤 | 反转 |");
    parts.push("|------|------|------|------|------|------|");
    for (const p of curve) {
      parts.push(`| ${p.position}% | ${p.tension} | ${p.suspense} | ${p.pleasure} | ${p.sadness} | ${p.reversal} |`);
    }

    if (techniques.length > 0) {
      parts.push("\n## 推荐叙事手段");
      for (const t of techniques) {
        parts.push(`- [${t.segment[0]}%-${t.segment[1]}%] ${t.technique}：${t.reason}`);
      }
    }
  } else {
    parts.push("## Emotional Curve Targets");
    parts.push("| Pos | Tension | Suspense | Pleasure | Sadness | Reversal |");
    parts.push("|-----|---------|----------|----------|---------|----------|");
    for (const p of curve) {
      parts.push(`| ${p.position}% | ${p.tension} | ${p.suspense} | ${p.pleasure} | ${p.sadness} | ${p.reversal} |`);
    }

    if (techniques.length > 0) {
      parts.push("\n## Recommended Narrative Techniques");
      for (const t of techniques) {
        parts.push(`- [${t.segment[0]}%-${t.segment[1]}%] ${t.technique}: ${t.reason}`);
      }
    }
  }

  return parts.join("\n");
}
