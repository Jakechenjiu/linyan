// 万象推演 — AI 深度分析

import { getAiConfig, callAi } from "@/lib/ai";

export interface AnalysisResult {
  summary: string;
  consensus: string[];
  disagreements: string[];
  risks: string[];
  opportunities: string[];
  actionItems: string[];
  keyTurningPoints: string[];
  confidence: "high" | "medium" | "low";
}

export async function analyzeSimulation(
  topic: string,
  result: string,
  userId: string
): Promise<AnalysisResult> {
  const config = await getAiConfig(userId);
  if (!config.hasKey) {
    throw new Error("请先配置 AI API Key");
  }

  const systemPrompt = `你是一位资深的战略分析师。你的任务是分析多智能体推演的结果，提取关键洞察。

请严格按照以下JSON格式输出，不要输出其他内容：

{
  "summary": "一句话总结推演结论",
  "consensus": ["共识点1", "共识点2"],
  "disagreements": ["分歧点1", "分歧点2"],
  "risks": ["风险1", "风险2"],
  "opportunities": ["机会1", "机会2"],
  "actionItems": ["行动建议1", "行动建议2"],
  "keyTurningPoints": ["关键转折点1", "关键转折点2"],
  "confidence": "high|medium|low"
}

分析要求：
- 从推演结果中提取真正的洞察，不要泛泛而谈
- 共识和分歧要有具体依据
- 风险和机会要可操作
- 行动建议要具体可执行
- 关键转折点是推演中观点发生重大变化的时刻`;

  const userMessage = `推演主题：${topic}

推演结果：
${result.slice(0, 8000)}

请分析以上推演结果，提取关键洞察。`;

  try {
    const response = await callAi({
      ...config,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      max_tokens: 2000,
      temperature: 0.3,
    });

    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback: return raw text as summary
    return {
      summary: response.slice(0, 500),
      consensus: [],
      disagreements: [],
      risks: [],
      opportunities: [],
      actionItems: [],
      keyTurningPoints: [],
      confidence: "low" as const,
    };
  } catch (e) {
    throw new Error(`分析失败: ${e instanceof Error ? e.message : "未知错误"}`);
  }
}

// 生成推演报告 Markdown
export function generateReport(topic: string, result: string, analysis: AnalysisResult): string {
  const lines: string[] = [];

  lines.push(`# 万象推演报告`);
  lines.push("");
  lines.push(`**主题**: ${topic}`);
  lines.push(`**生成时间**: ${new Date().toLocaleString("zh-CN")}`);
  lines.push(`**置信度**: ${analysis.confidence === "high" ? "高" : analysis.confidence === "medium" ? "中" : "低"}`);
  lines.push("");
  lines.push(`## 推演结论`);
  lines.push(analysis.summary);
  lines.push("");

  if (analysis.consensus.length > 0) {
    lines.push(`## 共识点`);
    analysis.consensus.forEach((item) => lines.push(`- ${item}`));
    lines.push("");
  }

  if (analysis.disagreements.length > 0) {
    lines.push(`## 分歧点`);
    analysis.disagreements.forEach((item) => lines.push(`- ${item}`));
    lines.push("");
  }

  if (analysis.risks.length > 0) {
    lines.push(`## 风险预警`);
    analysis.risks.forEach((item) => lines.push(`- ⚠️ ${item}`));
    lines.push("");
  }

  if (analysis.opportunities.length > 0) {
    lines.push(`## 机会洞察`);
    analysis.opportunities.forEach((item) => lines.push(`- ✅ ${item}`));
    lines.push("");
  }

  if (analysis.keyTurningPoints.length > 0) {
    lines.push(`## 关键转折点`);
    analysis.keyTurningPoints.forEach((item) => lines.push(`- 🔄 ${item}`));
    lines.push("");
  }

  if (analysis.actionItems.length > 0) {
    lines.push(`## 行动建议`);
    analysis.actionItems.forEach((item, i) => lines.push(`${i + 1}. ${item}`));
    lines.push("");
  }

  lines.push(`---`);
  lines.push(`## 推演原始记录`);
  lines.push(result);

  return lines.join("\n");
}
