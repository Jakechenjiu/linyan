// 灵砚 AI 助手 — 简洁版，直接调用 DeepSeek 工具调用

import { getAiConfig, callAiWithTools } from "@/lib/ai";
import { toolDefinitions, executeTool } from "./index";
import {
  runChapterPipeline,
  shouldTriggerPipeline,
  extractOutlineId,
} from "./pipeline";
import { prisma } from "@/lib/db";

interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

interface ToolCallRecord {
  tool: string;
  input: Record<string, string>;
  result: string;
}

export interface AgentTurnResult {
  response: string;
  toolCalls: ToolCallRecord[];
  modifiedBody?: string;
}

// 从文本中提取 [MODIFIED_BODY]
function extractModifiedBody(text: string): string | undefined {
  const match = text.match(/\[MODIFIED_BODY\]\s*([\s\S]*?)\s*\[\/MODIFIED_BODY\]/);
  return match ? match[1].trim() : undefined;
}

// 主函数
export async function runAgentSession(
  novelId: string,
  chapterId: string | null,
  userMessage: string,
  bodyText: string,
  history: AgentMessage[],
  userId: string,
  onToolStart?: (tool: string) => void,
  onToolEnd?: (tool: string, result: string) => void,
  novelContext?: { title: string; genre?: string; synopsis?: string },
): Promise<AgentTurnResult> {
  const config = await getAiConfig(userId);
  if (!config.hasKey) throw new Error("请先配置 AI API Key");

  // 检查是否应该触发章节生成管线
  if (shouldTriggerPipeline(userMessage)) {
    console.log("[Agent] Triggering chapter pipeline");

    // 获取大纲列表
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      select: { outlines: { where: { type: "chapter" }, select: { id: true, title: true } } },
    });

    const outlineId = novel
      ? extractOutlineId(userMessage, novel.outlines)
      : null;

    const result = await runChapterPipeline(
      novelId,
      userId,
      userMessage,
      outlineId || undefined,
      novelContext,
    );

    return {
      response: result.response,
      toolCalls: result.chapterId
        ? [
            {
              tool: "chapter_pipeline",
              input: { outlineId: outlineId || "auto" },
              result: result.response,
            },
          ]
        : [],
      modifiedBody: undefined,
    };
  }

  // 系统 prompt（简洁，不限制 AI）
  const novelInfo = novelContext
    ? `\n\n## 当前小说\n- 书名：${novelContext.title}${novelContext.genre ? `\n- 类型：${novelContext.genre}` : ""}${novelContext.synopsis ? `\n- 简介：${novelContext.synopsis}` : ""}`
    : "";

  const systemPrompt = `你是灵砚的AI写作助手。你聪明、有创意、懂写作。${novelInfo}

你可以用工具操作小说内容：
- read_chapter: 读取章节
- write_chapter: 写入/覆盖章节
- patch_chapter: 局部修改
- list_chapters: 列出所有章节
- search_content: 搜索内容
- create_chapter: 创建新章节

**重要规则：**
1. 你正在操作小说「${novelContext?.title || "未知"}」，所有操作都针对这本小说
2. 用户说"写第一章"或"续写"→ 必须用 create_chapter 或 write_chapter 写入完整内容，不能创建空章节
3. 用户说"改这段"→ 用 patch_chapter 修改
4. 用户讨论剧情 → 直接回答
5. 每次工具调用后，必须给出文字回复，解释你做了什么或给出建议

修改正文后，在回复末尾用这个格式输出新正文：
[MODIFIED_BODY]
完整新正文
[/MODIFIED_BODY]`;

  // 构建消息
  const messages: AgentMessage[] = [
    ...history.slice(-6),
    { role: "user", content: userMessage },
  ];

  // 工具调用循环（最多5轮）
  const allToolCalls: ToolCallRecord[] = [];
  let finalText = "";
  let modifiedBody: string | undefined;

  for (let i = 0; i < 5; i++) {
    const response = await callAiWithTools({
      ...config,
      system: systemPrompt,
      messages,
      tools: toolDefinitions,
      max_tokens: 4096,
      temperature: 0.8,
    });

    // 没有工具调用 = 最终响应
    if (response.toolCalls.length === 0) {
      finalText = response.text;
      modifiedBody = extractModifiedBody(response.text);
      break;
    }

    // 执行工具调用
    for (const tc of response.toolCalls) {
      onToolStart?.(tc.name);
      const result = await executeTool(tc.name, tc.input, novelId);
      onToolEnd?.(tc.name, result);
      allToolCalls.push({ tool: tc.name, input: tc.input, result });

      // 把工具结果加入消息
      messages.push({ role: "assistant", content: response.text || "" });
      messages.push({ role: "user", content: `[${tc.name}]\n${result}\n\n基于以上信息，请给出你的分析和建议。` });
    }
  }

  // 如果循环结束但没有最终响应，强制生成一次
  if (!finalText && allToolCalls.length > 0) {
    const finalResponse = await callAiWithTools({
      ...config,
      system: systemPrompt,
      messages: [
        ...messages,
        { role: "user", content: "基于以上工具返回的信息，请给出你的完整回复。" },
      ],
      tools: toolDefinitions,
      max_tokens: 4096,
      temperature: 0.8,
    });
    finalText = finalResponse.text;
    modifiedBody = extractModifiedBody(finalResponse.text);
  }

  return {
    response: finalText || "已完成操作，请查看结果。",
    toolCalls: allToolCalls,
    modifiedBody,
  };
}
