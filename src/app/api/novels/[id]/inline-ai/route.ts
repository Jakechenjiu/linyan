import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAi } from "@/lib/ai";
import { NextResponse } from "next/server";

const ACTION_PROMPTS: Record<string, string> = {
  rewrite: `你是一位专业的网文编辑。请改写以下文字，保持原意但换一种表达方式。
要求：
- 保持原文的语气和风格
- 不要改变剧情含义
- 避免 AI 味表达（缓缓/淡淡/微微/仿佛）
- 直接输出改写后的文字，不要解释`,

  expand: `你是一位专业的网文作家。请将以下文字扩写，增加细节和描写。
要求：
- 增加感官描写（视觉/听觉/触觉/嗅觉）
- 增加环境细节和氛围
- 增加角色的微表情和动作
- 保持原文的剧情走向
- 直接输出扩写后的文字，不要解释`,

  compress: `你是一位专业的网文编辑。请精简以下文字，删除冗余内容。
要求：
- 删除重复的描写和多余的修饰词
- 保留核心剧情和关键对话
- 让文字更紧凑有力
- 直接输出精简后的文字，不要解释`,

  describe: `你是一位专业的网文作家。请用五感描写丰富以下文字。
要求：
- 视觉：光影、颜色、形状、动作
- 听觉：声音、寂静、回响
- 触觉：温度、质感、疼痛
- 嗅觉：气味、香气、腐朽
- 味觉：如果场景允许
- 用具体细节替代抽象描述
- 直接输出描写后的文字，不要解释`,
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const { chapterId, selectedText, action } = await req.json();

  if (!selectedText?.trim()) {
    return NextResponse.json({ error: "没有选中文字" }, { status: 400 });
  }

  if (selectedText.length > 5000) {
    return NextResponse.json({ error: "选中文字过长（最多 5000 字）" }, { status: 400 });
  }

  if (!ACTION_PROMPTS[action]) {
    return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
  }

  // 验证权限
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { userId: true, title: true, genre: true },
  });
  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const config = await getAiConfig(session.user.id);
  if (!config.hasKey) {
    return NextResponse.json({ error: "请先配置 AI API Key" }, { status: 400 });
  }

  // 获取章节上下文
  let chapterContext = "";
  if (chapterId) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { title: true, body: true },
    });
    if (chapter) {
      // 取选中文字前后各 500 字作为上下文
      const normalizedBody = chapter.body.replace(/\r\n/g, "\n");
      const normalizedText = selectedText.replace(/\r\n/g, "\n");
      const idx = normalizedBody.indexOf(normalizedText);
      if (idx >= 0) {
        const start = Math.max(0, idx - 500);
        const end = Math.min(normalizedBody.length, idx + normalizedText.length + 500);
        chapterContext = normalizedBody.slice(start, end);
      }
    }
  }

  try {
    const systemPrompt = ACTION_PROMPTS[action];

    const userMessage = chapterContext
      ? `章节上下文：\n${chapterContext}\n\n请处理选中的文字：\n${selectedText}`
      : `请处理以下文字：\n${selectedText}`;

    const result = await callAi({
      ...config,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      max_tokens: 2048,
      temperature: 0.7,
    });

    return NextResponse.json({ result: result.trim() });
  } catch (e) {
    console.error("[InlineAI] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI 处理失败" },
      { status: 500 }
    );
  }
}
