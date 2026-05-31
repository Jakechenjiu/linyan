// 灵砚 Agent 会话引擎 — 快速版
// 优化：精简上下文 + 流式输出 + 工具异步

import { getAiConfig, callAi } from "@/lib/ai";
import { createAgentTools, type AgentTool, type ToolResult } from "./index";
import { ANTI_AI_RULES } from "@/lib/prompts";

interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

interface ToolCall {
  tool: string;
  params: Record<string, string>;
  result: ToolResult;
}

interface AgentTurnResult {
  response: string;
  toolCalls: ToolCall[];
  modifiedBody?: string;
}

// 构建精简工具描述
function buildToolDescriptions(tools: AgentTool[]): string {
  return tools.map((t) => {
    const params = Object.entries(t.parameters)
      .map(([name, p]) => `${name}(${p.type}${p.required ? "*" : ""})`)
      .join(", ");
    return `- ${t.name}: ${t.description} [参数: ${params}]`;
  }).join("\n");
}

// 解析工具调用
function parseToolCalls(text: string): Array<{ name: string; params: Record<string, string> }> {
  const calls: Array<{ name: string; params: Record<string, string> }> = [];
  const regex = /\[TOOL_CALL\]\s*(\w+)\s*(\{[\s\S]*?\})\s*\[\/TOOL_CALL\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      calls.push({ name: match[1], params: JSON.parse(match[2]) });
    } catch {}
  }
  return calls;
}

// 提取修改后的正文
function extractModifiedBody(text: string): string | undefined {
  const match = text.match(/\[MODIFIED_BODY\]\s*([\s\S]*?)\s*\[\/MODIFIED_BODY\]/);
  return match ? match[1].trim() : undefined;
}

// Agent 会话主函数 — 快速版
export async function runAgentSession(
  novelId: string,
  chapterId: string | null,
  userMessage: string,
  bodyText: string,
  history: AgentMessage[],
  userId: string,
  onToolStart?: (tool: string) => void,
  onToolEnd?: (tool: string, result: ToolResult) => void,
  onStream?: (text: string) => void,
): Promise<AgentTurnResult> {
  const config = await getAiConfig(userId);
  if (!config.hasKey) throw new Error("请先配置 AI API Key");

  const tools = createAgentTools(novelId);
  const toolDescriptions = buildToolDescriptions(tools);

  // 精简系统 prompt — 只发关键信息
  const systemPrompt = `你是灵砚AI写作助手。直接、高效、不废话。

## 工具
${toolDescriptions}

## 工具调用格式
[TOOL_CALL]
工具名
{"参数": "值"}
[/TOOL_CALL]

## 修改正文格式
[MODIFIED_BODY]
完整新正文
[/MODIFIED_BODY]

## 规则
- 修改正文前先说明改了什么
- 输出修改后的完整正文用 [MODIFIED_BODY] 包裹
- 不废话，直接做

${ANTI_AI_RULES}`;

  // 精简用户消息 — 只发当前正文
  const userContent = bodyText
    ? `当前正文：\n${bodyText.slice(-6000)}\n\n---\n${userMessage}`
    : userMessage;

  const messages: AgentMessage[] = [
    ...history.slice(-4), // 只保留最近4条对话
    { role: "user", content: userContent },
  ];

  // Agent 循环
  const maxToolCalls = 3;
  let allToolCalls: ToolCall[] = [];
  let finalResponse = "";
  let modifiedBody: string | undefined;

  for (let turn = 0; turn <= maxToolCalls; turn++) {
    const aiResponse = await callAi({
      ...config,
      system: systemPrompt,
      messages,
      max_tokens: 2048,
      temperature: 0.7,
    });

    const toolCalls = parseToolCalls(aiResponse);

    if (toolCalls.length === 0) {
      finalResponse = aiResponse.replace(/\[MODIFIED_BODY\][\s\S]*?\[\/MODIFIED_BODY\]/g, "").trim();
      modifiedBody = extractModifiedBody(aiResponse);
      break;
    }

    // 执行工具
    const toolResults: string[] = [];
    for (const call of toolCalls) {
      const tool = tools.find((t) => t.name === call.name);
      if (!tool) {
        toolResults.push(`工具 ${call.name} 不存在`);
        continue;
      }
      onToolStart?.(call.name);
      const result = await tool.execute(call.params);
      onToolEnd?.(call.name, result);
      allToolCalls.push({ tool: call.name, params: call.params, result });
      toolResults.push(`[${call.name}] ${result.content.slice(0, 200)}`);
    }

    messages.push({ role: "assistant", content: aiResponse });
    messages.push({ role: "user", content: `工具结果：\n${toolResults.join("\n")}\n\n继续回复。` });
  }

  return {
    response: finalResponse || "处理完成",
    toolCalls: allToolCalls,
    modifiedBody,
  };
}
