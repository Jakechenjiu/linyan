// 灵砚 AI 助手会话 — 使用原生工具调用

import { getAiConfig, callAiWithTools, type AiToolCall } from "@/lib/ai";
import { allTools, executeTool } from "./index";

interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

interface ToolCallRecord {
  tool: string;
  input: Record<string, string>;
  result: string;
}

interface AgentTurnResult {
  response: string;
  toolCalls: ToolCallRecord[];
  modifiedBody?: string;
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
  onToolEnd?: (tool: string, result: string) => void,
): Promise<AgentTurnResult> {
  const config = await getAiConfig(userId);
  if (!config.hasKey) throw new Error("请先配置 AI API Key");

  // 简洁的系统 prompt
  const systemPrompt = `你是灵砚的 AI 写作助手。你聪明、有创意、懂写作。

## 你的行为
- 用户说"继续写"、"写下一段" → 用 create_chapter 创建新章节，或用 write_chapter 写入新内容
- 用户说"改这段"、"润色" → 用 patch_chapter 做局部修改
- 用户说"重写这章" → 用 write_chapter 整章覆盖
- 用户讨论剧情/角色 → 直接回答
- 用户问问题 → 先用 read_chapter 读内容，再回答

## 修改正文后
在回复末尾用以下格式输出修改后的完整正文：
[MODIFIED_BODY]
完整的新正文
[/MODIFIED_BODY]

## 规则
- 你自主判断该怎么做
- 写新内容时大胆创作，不要只是分析
- 改内容时直接改，不要先分析再改
- 不要在回复中加表情符号
- 回复简洁，不说废话`;

  // 构建消息
  const messages: AgentMessage[] = [
    ...history.slice(-6),
    { role: "user", content: userMessage },
  ];

  // 工具调用循环
  const allToolCalls: ToolCallRecord[] = [];
  let finalText = "";
  let modifiedBody: string | undefined;
  const maxIterations = 5;

  for (let i = 0; i < maxIterations; i++) {
    const response = await callAiWithTools({
      ...config,
      system: systemPrompt,
      messages,
      tools: allTools,
      max_tokens: 4096,
      temperature: 0.8,
    });

    // 没有工具调用，这是最终响应
    if (response.toolCalls.length === 0) {
      finalText = response.text;
      modifiedBody = extractModifiedBody(response.text);
      break;
    }

    // 执行工具调用
    for (const toolCall of response.toolCalls) {
      onToolStart?.(toolCall.name);

      const result = await executeTool(toolCall.name, toolCall.input, novelId);

      onToolEnd?.(toolCall.name, result);

      allToolCalls.push({
        tool: toolCall.name,
        input: toolCall.input,
        result,
      });

      // 把工具结果加入消息，继续对话
      messages.push({ role: "assistant", content: response.text || "" });
      messages.push({
        role: "user",
        content: `[${toolCall.name} 结果]\n${result}\n\n继续。`,
      });
    }
  }

  return {
    response: finalText || "处理完成",
    toolCalls: allToolCalls,
    modifiedBody,
  };
}
