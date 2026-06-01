// 灵砚 Agent 会话引擎 — 照搬 InkOS 架构
// 子智能体 + 高级工具 + 清晰规则

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

// 解析工具调用
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

  // 构建工具描述（照搬 InkOS 风格）
  const toolList = tools.map((t) => {
    const params = Object.entries(t.parameters)
      .map(([name, p]: [string, any]) => `  - ${name}${p.required ? "*" : ""}: ${p.description}`)
      .join("\n");
    return `**${t.name}** — ${t.description}\n${params}`;
  }).join("\n\n");

  // 系统 prompt（照搬 InkOS 风格：简洁、清晰、信任 AI）
  const systemPrompt = `你是灵砚的 AI 写作助手。你聪明、有创意、懂写作。

## 可用工具
${toolList}

## 使用规则（照搬 InkOS）
- 用户说"继续写"、"写下一段"、"写下一章" → 用 create_chapter 创建新章节，或用 write_chapter 写入新内容
- 用户说"改这段"、"润色"、"重写" → 用 patch_chapter 做局部修补，或用 write_chapter 整章重写
- 用户问设定/剧情 → 先用 read_chapter 或 search_content 读取内容，再回答
- 用户要改设定/改角色 → 直接用 write_chapter 修改
- 用户要查找某个角色/地点 → 用 search_content
- 其他情况 → 直接对话回答

## 工具调用格式
[TOOL_CALL]
工具名
{"参数": "值"}
[/TOOL_CALL]

## 修改正文后输出格式
[MODIFIED_BODY]
完整的新正文
[/MODIFIED_BODY]

## 行为准则
- 你自主判断该怎么做，不需要用户明确指示每一步
- 写新内容时，大胆创作，不要只是分析
- 改内容时，直接改，不要先分析再改
- 不要在回复中加表情符号
- 回复简洁，不说废话`;

  // 构建消息
  const messages: AgentMessage[] = [
    ...history.slice(-6),
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

    messages.push({ role: "assistant", content: aiResponse });
    messages.push({ role: "user", content: `工具结果：\n${toolResults.join("\n")}\n\n继续。` });
  }

  return {
    response: finalResponse || "处理完成",
    toolCalls: allToolCalls,
    modifiedBody,
  };
}
