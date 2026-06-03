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

  try {
    const result = await runAgentSession(
      novelId,
      chapterId || null,
      message.trim(),
      truncatedBody,
      history || [],
      session.user.id,
      undefined,
      undefined,
      novelContext,
    );

    return NextResponse.json({
      response: result.response,
      toolCalls: result.toolCalls.map((tc) => ({
        tool: tc.tool,
        success: true,
        summary: tc.result.slice(0, 100),
      })),
      modifiedBody: result.modifiedBody,
    });
  } catch (e: unknown) {
    console.error(`[AI Assistant] Error:`, e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI 调用失败" },
      { status: 500 }
    );
  }
}
