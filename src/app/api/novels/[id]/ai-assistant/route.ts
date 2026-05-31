import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAi } from "@/lib/ai";
import { createAgentTools, type ToolResult } from "@/lib/agent-tools";
import { ANTI_AI_RULES } from "@/lib/prompts";
import { NextResponse } from "next/server";

// 精简工具描述
function buildToolDescriptions(tools: { name: string; description: string; parameters: Record<string, unknown> }[]): string {
  return tools.map((t) => {
    const params = Object.entries(t.parameters)
      .map(([name, p]: [string, any]) => `${name}(${p.type}${p.required ? "*" : ""})`)
      .join(", ");
    return `- ${t.name}: ${t.description} [${params}]`;
  }).join("\n");
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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const { chapterId, message, bodyText, history } = await req.json();

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { userId: true },
  });

  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: "请输入消息" }, { status: 400 });
  }

  const config = await getAiConfig(session.user.id);
  if (!config.hasKey) {
    return NextResponse.json({ error: "请先配置 AI API Key" }, { status: 400 });
  }

  const tools = createAgentTools(novelId);
  const toolDescriptions = buildToolDescriptions(tools);

  // 精简系统 prompt
  const systemPrompt = `你是灵砚AI写作助手。直接、高效。

## 工具
${toolDescriptions}

## 格式
工具调用: [TOOL_CALL] 工具名 {"参数":"值"} [/TOOL_CALL]
修改正文: [MODIFIED_BODY] 完整新正文 [/MODIFIED_BODY]

## 规则
- 修改正文前简要说明改了什么
- 用 [MODIFIED_BODY] 包裹修改后的完整正文
- 不废话

${ANTI_AI_RULES}`;

  // 精简消息
  const truncatedBody = bodyText ? bodyText.slice(-6000) : "";
  const userContent = truncatedBody
    ? `正文：\n${truncatedBody}\n\n---\n${message.trim()}`
    : message.trim();

  const messages = [
    ...(history || []).slice(-4).map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" as const : "assistant" as const,
      content: m.content,
    })),
    { role: "user" as const, content: userContent },
  ];

  // 流式输出
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Agent 循环
        const maxToolCalls = 3;
        let toolCallsSummary: Array<{ tool: string; success: boolean; summary: string }> = [];
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
            // 最终响应
            const cleanResponse = aiResponse
              .replace(/\[MODIFIED_BODY\][\s\S]*?\[\/MODIFIED_BODY\]/g, "")
              .replace(/\[TOOL_CALL\][\s\S]*?\[\/TOOL_CALL\]/g, "")
              .trim();

            modifiedBody = extractModifiedBody(aiResponse);

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "response",
              content: cleanResponse,
              toolCalls: toolCallsSummary,
              modifiedBody,
            })}\n\n`));
            break;
          }

          // 执行工具
          for (const call of toolCalls) {
            const tool = tools.find((t) => t.name === call.name);
            if (!tool) continue;

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "tool_start",
              tool: call.name,
            })}\n\n`));

            const result = await tool.execute(call.params);

            toolCallsSummary.push({
              tool: call.name,
              success: result.success,
              summary: result.content.slice(0, 100),
            });

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "tool_end",
              tool: call.name,
              success: result.success,
              summary: result.content.slice(0, 100),
            })}\n\n`));

            // 将工具结果加入上下文
            messages.push({ role: "assistant", content: aiResponse });
            messages.push({ role: "user", content: `工具 ${call.name} 结果：${result.content.slice(0, 500)}\n继续。` });
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "error",
          message: e instanceof Error ? e.message : "AI 调用失败",
        })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
