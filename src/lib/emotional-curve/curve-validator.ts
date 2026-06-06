// 情感曲线验证器 — 生成后验证实际曲线是否达标

import type { EmotionalDataPoint, CurveValidation } from "./types";
import { EMOTIONAL_DIMENSIONS } from "./dimensions";

/**
 * 用 AI 评估实际文本的情感曲线
 */
export async function analyzeActualCurve(
  chapterBody: string,
  llmCall: (system: string, user: string) => Promise<string>
): Promise<EmotionalDataPoint[]> {
  const system = `你是一位专业的文学分析师。分析以下章节文本的情感曲线。

输出严格 JSON 数组（不要 markdown 代码块），5 个数据点，每个点代表文本的 0%、25%、50%、75%、100% 位置：
[
  {"position": 0, "tension": 0-10, "suspense": 0-10, "pleasure": 0-10, "sadness": 0-10, "reversal": 0-10},
  {"position": 25, ...},
  {"position": 50, ...},
  {"position": 75, ...},
  {"position": 100, ...}
]

维度说明：
- tension: 紧张度（0=完全放松，10=极度紧张）
- suspense: 悬念度（0=无悬念，10=极度好奇）
- pleasure: 愉悦度（0=无愉悦，10=极度满足）
- sadness: 悲伤度（0=无悲伤，10=极度心痛）
- reversal: 反转度（0=无意外，10=极度震惊）

基于文本的实际内容评分，不要猜测。`;

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
 * 比较目标曲线和实际曲线
 */
export function validateCurve(
  target: EmotionalDataPoint[],
  actual: EmotionalDataPoint[]
): CurveValidation {
  if (target.length === 0 || actual.length === 0) {
    return {
      tensionMatch: 0,
      suspenseMatch: 0,
      pleasureMatch: 0,
      sadnessMatch: 0,
      reversalMatch: 0,
      overallMatch: 0,
    };
  }

  // 对齐位置（取最近的点）
  const aligned = target.map((t) => {
    const closest = actual.reduce((prev, curr) =>
      Math.abs(curr.position - t.position) < Math.abs(prev.position - t.position) ? curr : prev
    );
    return { target: t, actual: closest };
  });

  // 计算每个维度的匹配度
  const calcMatch = (key: keyof Omit<EmotionalDataPoint, "position">) => {
    const diffs = aligned.map(({ target: t, actual: a }) => {
      const diff = Math.abs(t[key] - a[key]);
      return Math.max(0, 100 - diff * 10); // 每差 1 分扣 10 分
    });
    return Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
  };

  const tensionMatch = calcMatch("tension");
  const suspenseMatch = calcMatch("suspense");
  const pleasureMatch = calcMatch("pleasure");
  const sadnessMatch = calcMatch("sadness");
  const reversalMatch = calcMatch("reversal");
  const overallMatch = Math.round(
    (tensionMatch + suspenseMatch + pleasureMatch + sadnessMatch + reversalMatch) / 5
  );

  return {
    tensionMatch,
    suspenseMatch,
    pleasureMatch,
    sadnessMatch,
    reversalMatch,
    overallMatch,
  };
}

/**
 * 将验证结果格式化为文本
 */
export function formatValidationForPrompt(
  validation: CurveValidation,
  language: "zh" | "en" = "zh"
): string {
  if (language === "zh") {
    return `## 情感曲线验证
- 紧张度匹配：${validation.tensionMatch}%
- 悬念度匹配：${validation.suspenseMatch}%
- 愉悦度匹配：${validation.pleasureMatch}%
- 悲伤度匹配：${validation.sadnessMatch}%
- 反转度匹配：${validation.reversalMatch}%
- 综合匹配：${validation.overallMatch}%`;
  }

  return `## Curve Validation
- Tension match: ${validation.tensionMatch}%
- Suspense match: ${validation.suspenseMatch}%
- Pleasure match: ${validation.pleasureMatch}%
- Sadness match: ${validation.sadnessMatch}%
- Reversal match: ${validation.reversalMatch}%
- Overall match: ${validation.overallMatch}%`;
}
