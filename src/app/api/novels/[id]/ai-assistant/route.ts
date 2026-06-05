import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAgentSession } from "@/lib/agent-tools/session";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const { chapterId, message, bodyText, history } = await req.json();

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: {
      userId: true,
      title: true,
      genre: true,
      synopsis: true,
    },
  });

  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: "请输入消息" }, { status: 400 });
  }

  // 限制正文长度
  const truncatedBody = bodyText ? bodyText.slice(-8000) : "";

  // 构建小说上下文
  const novelContext = {
    title: novel.title,
    genre: novel.genre || undefined,
    synopsis: novel.synopsis || undefined,
  };

  // SSE 流式响应
  const userId = session.user.id;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send("start", { message: "开始处理..." });

        const result = await runAgentSession(
          novelId,
          chapterId || null,
          message.trim(),
          truncatedBody,
          history || [],
          userId,
          // onToolStart
          (tool: string) => {
            send("tool-start", { tool });
          },
          // onToolEnd
          (tool: string, toolResult: string) => {
            send("tool-end", { tool, summary: toolResult.slice(0, 100) });
          },
          novelContext,
          // onPipelineProgress
          (progress) => {
            send("pipeline", progress);
          },
        );

        // 流式输出最终响应
        const responseText = result.response || "处理完成";
        const words = responseText.split(/(?<=[。，！？、；\n])/);
        for (const word of words) {
          send("text", { content: word });
          await new Promise((r) => setTimeout(r, 30));
        }

        send("done", {
          toolCalls: result.toolCalls.map((tc) => ({
            tool: tc.tool,
            success: true,
            summary: tc.result.slice(0, 100),
          })),
          modifiedBody: result.modifiedBody,
        });

        controller.close();
      } catch (e: unknown) {
        console.error(`[AI Assistant] Error:`, e);
        send("error", { message: e instanceof Error ? e.message : "AI 调用失败" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
