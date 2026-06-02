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
    select: { userId: true },
  });

  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: "请输入消息" }, { status: 400 });
  }

  // 限制正文长度
  const truncatedBody = bodyText ? bodyText.slice(-8000) : "";

  // 调试日志
  console.log(`[AI Assistant] novel=${novelId}, chapter=${chapterId}, bodyLen=${bodyText?.length || 0}, truncatedLen=${truncatedBody.length}, msg=${message.trim().slice(0, 50)}`);

  // SSE 流式输出
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await runAgentSession(
          novelId,
          chapterId || null,
          message.trim(),
          truncatedBody,
          history || [],
          session.user!.id!,
          (tool) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_start", tool })}\n\n`));
          },
          (tool, result) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "tool_end",
              tool,
              success: result.success,
              summary: result.content.slice(0, 100),
            })}\n\n`));
          },
        );

        // 发送最终响应
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "response",
          content: result.response,
          toolCalls: result.toolCalls.map((tc) => ({
            tool: tc.tool,
            success: tc.result.success,
            summary: tc.result.content.slice(0, 100),
          })),
          modifiedBody: result.modifiedBody,
        })}\n\n`));

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
