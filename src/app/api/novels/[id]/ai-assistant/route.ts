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

  try {
    // 限制 bodyText 长度，避免超出 API 上下文窗口
    const truncatedBody = bodyText ? bodyText.slice(0, 8000) : "";

    const result = await runAgentSession(
      novelId,
      chapterId || null,
      message.trim(),
      truncatedBody,
      history || [],
      session.user.id,
    );

    return NextResponse.json({
      response: result.response,
      toolCalls: result.toolCalls.map((tc) => ({
        tool: tc.tool,
        success: tc.result.success,
        summary: tc.result.content.slice(0, 100),
      })),
      modifiedBody: result.modifiedBody,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI 调用失败" },
      { status: 500 }
    );
  }
}
