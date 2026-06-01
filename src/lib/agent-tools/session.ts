// 灵砚 AI 助手 — 简洁版
// 核心理念：信任 AI，给工具，不限制思考

import { getAiConfig, callAi } from "@/lib/ai";
import { createAgentTools, type AgentTool, type ToolResult } from "./index";

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

// 解析 AI 响应中的工具调用
function parseToolCalls(text: string): Array<{ name: string; params: Record<string, string> }> {
  const calls: Array<{ name: string; params: Record<string, string> }> = [];
  const regex = /\[TOOL_CALL\]\s*(\w+)\s*(\{[\s\S]*?\})\s*\[\/TOOL_CALL\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try { calls.push({ name: match[1], params: JSON.parse(match[2]) }); } catch {}
  }
  return calls;
}

// 提取修改后的正文
function extractModifiedBody(text: string): string | undefined {
  const match = text.match(/\[MODIFIED_BODY\]\s*([\s\S]*?)\s*\[\/MODIFIED_BODY\]/);
  return match ? match[1].trim() : undefined;
}

// Agent 会话主函数
export async function runAgentSession(
  novelId: string,
  chapterId: string | null,
  userMessage: string,
  bodyText: string,
  history: AgentMessage[],
  userId: string,
  onToolStart?: (tool: string) => void,
  onToolEnd?: (tool: string, result: ToolResult) => void,
): Promise<AgentTurnResult> {
  const config = await getAiConfig(userId);
  if (!config.hasKey) throw new Error("请先配置 AI API Key");

  const tools = createAgentTools(novelId);

  // 简洁的工具描述
  const toolList = tools.map((t) => {
    const params = Object.entries(t.parameters)
      .map(([name, p]: [string, any]) => `${name}${p.required ? "*" : ""}`)
      .join(", ");
    return `- ${t.name}(${params}): ${t.description}`;
  }).join("\n");

  // 简洁的系统 prompt — 不限制 AI 思考
  const systemPrompt = `你是灵砚的 AI 写作助手。你聪明、有创意、懂写作。

## 你可以用这些工具操作小说内容：
${toolList}

## 工具调用格式（仅在需要时使用）：
[TOOL_CALL]
工具名
{"参数": "值"}
[/TOOL_CALL]

## 修改正文后输出格式：
[MODIFIED_BODY]
完整的新正文
[/MODIFIED_BODY]

## 你的行为准则：
- 用户说"继续写"→ 你创作新内容，追加到正文
- 用户说"改这段"→ 你修改现有内容
- 用户讨论剧情 → 你分析、建议
- 你可以先读取内容(read)，再决定怎么做
- 你可以直接写入新内容(write)或精确修改(edit)
- 你自主判断该怎么做，不需要用户明确指示每一步`;

  // 构建消息
  const messages: AgentMessage[] = [
    ...history.slice(-4),
    { role: "user", content: userMessage },
  ];

  // Agent 循环
  let allToolCalls: ToolCall[] = [];
  let finalResponse = "";
  let modifiedBody: string | undefined;

  for (let turn = 0; turn <= 5; turn++) {
    const aiResponse = await callAi({
      ...config,
      system: systemPrompt,
      messages,
      max_tokens: 4096,
      temperature: 0.8,
    });

    const toolCalls = parseToolCalls(aiResponse);

    if (toolCalls.length === 0) {
      // 没有工具调用，这是最终响应
      finalResponse = aiResponse
        .replace(/\[MODIFIED_BODY\][\s\S]*?\[\/MODIFIED_BODY\]/g, "")
        .replace(/\[TOOL_CALL\][\s\S]*?\[\/TOOL_CALL\]/g, "")
        .trim();
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
      toolResults.push(`[${call.name}] ${result.content.slice(0, 500)}`);
    }

    // 工具结果反馈给 AI
    messages.push({ role: "assistant", content: aiResponse });
    messages.push({ role: "user", content: `工具执行结果：\n${toolResults.join("\n")}\n\n继续。` });
  }

  return {
    response: finalResponse || "处理完成",
    toolCalls: allToolCalls,
    modifiedBody,
  };
}
