// 灵砚 Agent 会话引擎 — 参考 InkOS agent-session 设计
// AI 决定调用哪些工具，系统执行并返回结果

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

// 构建工具描述
function buildToolDescriptions(tools: AgentTool[]): string {
  return tools.map((t) => {
    const params = Object.entries(t.parameters)
      .map(([name, p]) => `    - ${name} (${p.type}${p.required ? ", 必填" : ""}): ${p.description}`)
      .join("\n");
    return `### ${t.name}\n${t.description}\n参数:\n${params}`;
  }).join("\n\n");
}

// 解析 AI 响应中的工具调用
function parseToolCalls(text: string): Array<{ name: string; params: Record<string, string> }> {
  const calls: Array<{ name: string; params: Record<string, string> }> = [];
  const regex = /\[TOOL_CALL\]\s*(\w+)\s*(\{[\s\S]*?\})\s*\[\/TOOL_CALL\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      const name = match[1];
      const params = JSON.parse(match[2]);
      calls.push({ name, params });
    } catch {}
  }
  return calls;
}

// 从 AI 响应中提取修改后的正文
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
  onStream?: (text: string) => void,
): Promise<AgentTurnResult> {
  const config = await getAiConfig(userId);
  if (!config.hasKey) throw new Error("请先配置 AI API Key");

  const tools = createAgentTools(novelId);
  const toolDescriptions = buildToolDescriptions(tools);

  // 读取章节内容用于上下文
  let chapterContext = "";
  if (chapterId) {
    const readResult = await tools.find((t) => t.name === "read")?.execute({ chapterId });
    if (readResult?.success) {
      chapterContext = readResult.content;
    }
  }

  const systemPrompt = `你是灵砚的AI写作助手。

## 你的能力
你可以使用以下工具来读取和修改小说内容：

${toolDescriptions}

## 如何使用工具
当你需要使用工具时，用以下格式：
[TOOL_CALL]
工具名
{"参数名": "参数值"}
[/TOOL_CALL]

当你需要修改正文时，输出修改后的完整正文：
[MODIFIED_BODY]
完整的修改后正文
[/MODIFIED_BODY]

## 规则
${ANTI_AI_RULES}

## 当前状态
${chapterContext ? `当前章节内容：\n${chapterContext}` : "尚未选择章节"}`;

  // 构建消息
  const messages: AgentMessage[] = [
    ...history.slice(-6),
    { role: "user", content: userMessage },
  ];

  // Agent 循环：最多执行 5 次工具调用
  const maxToolCalls = 5;
  let allToolCalls: ToolCall[] = [];
  let finalResponse = "";
  let modifiedBody: string | undefined;

  for (let turn = 0; turn <= maxToolCalls; turn++) {
    // 调用 AI
    const aiResponse = await callAi({
      ...config,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: 4096,
      temperature: 0.7,
    });

    // 检查是否有工具调用
    const toolCalls = parseToolCalls(aiResponse);

    if (toolCalls.length === 0) {
      // 没有工具调用，这就是最终响应
      finalResponse = aiResponse.replace(/\[MODIFIED_BODY\][\s\S]*?\[\/MODIFIED_BODY\]/g, "").trim();
      modifiedBody = extractModifiedBody(aiResponse);
      break;
    }

    // 执行工具调用
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
      toolResults.push(`[${call.name}] ${result.content}`);
    }

    // 将工具结果添加到消息历史，继续对话
    messages.push({ role: "assistant", content: aiResponse });
    messages.push({
      role: "user",
      content: `工具执行结果：\n${toolResults.join("\n")}\n\n请根据结果继续回复用户。`,
    });

    onStream?.(`执行了 ${toolCalls.length} 个工具，继续处理…`);
  }

  return {
    response: finalResponse,
    toolCalls: allToolCalls,
    modifiedBody,
  };
}
