import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAiStream } from "@/lib/ai";
import { MODE_PROMPTS } from "@/lib/prompts";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const { chapterId, mode, selectedText, instruction, bodyText } = await req.json();

  if (!MODE_PROMPTS[mode]) {
    return NextResponse.json({ error: `未知模式: ${mode}` }, { status: 400 });
  }

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      worldSetting: true,
      characters: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const config = await getAiConfig(session.user.id);
  if (!config.hasKey) {
    return NextResponse.json({ error: "请先在设置中配置您的 AI API Key", code: "NO_API_KEY" }, { status: 400 });
  }

  // For continue mode, delegate to the existing generate endpoint logic
  if (mode === "continue") {
    // Build minimal context and stream continuation
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) return NextResponse.json({ error: "章节不存在" }, { status: 404 });

    const context = `# ${novel.title}\n${chapter.body.slice(-3000)}`;
    const stream = callAiStream({
      ...config,
      system: `续写以下内容。直接从正文开始，禁止开场白。`,
      messages: [{ role: "user", content: context }],
      max_tokens: 4096,
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  }

  // Chat mode: uses full body text
  if (mode === "chat") {
    const text = bodyText || selectedText;
    if (!text) return NextResponse.json({ error: "没有正文内容" }, { status: 400 });

    const parts: string[] = [];
    parts.push(`# 小说: ${novel.title}`);
    if (novel.genre) parts.push(`类型: ${novel.genre}`);
    if (novel.characters.length > 0) {
      parts.push("\n## 角色");
      for (const c of novel.characters) {
        parts.push(`- ${c.name}(${c.role})${c.personality ? `: ${c.personality}` : ""}`);
      }
    }
    if (novel.worldSetting?.rules) parts.push(`\n## 世界铁律\n${novel.worldSetting.rules}`);

    const modePromptBuilder = MODE_PROMPTS["chat"];
    const modePrompt = modePromptBuilder({ selectedText: text, instruction });
    const systemPrompt = `${parts.join("\n")}\n\n${modePrompt}`;

    const stream = callAiStream({
      ...config,
      system: systemPrompt,
      messages: [{ role: "user", content: instruction || "请修改正文" }],
      max_tokens: 8192,
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  }

  // For brainstorm mode, build context from chapter
  let textForMode = selectedText;
  if (!textForMode && chapterId && mode !== "brainstorm") {
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    if (chapter?.body) {
      // Use last paragraph as fallback
      const paragraphs = chapter.body.split("\n\n").filter(Boolean);
      textForMode = paragraphs.slice(-2).join("\n\n");
    }
  }

  if (mode !== "brainstorm" && !textForMode) {
    return NextResponse.json({ error: "请先选中文本，或在章节中写作后再试" }, { status: 400 });
  }

  // Build system prompt with novel context
  const parts: string[] = [];
  parts.push(`# 小说: ${novel.title}`);
  if (novel.genre) parts.push(`类型: ${novel.genre}`);
  if (novel.characters.length > 0) {
    parts.push("\n## 角色");
    for (const c of novel.characters) {
      parts.push(`- ${c.name}(${c.role})${c.personality ? `: ${c.personality}` : ""}`);
    }
  }

  const modePromptBuilder = MODE_PROMPTS[mode];
  const modePrompt = modePromptBuilder({ selectedText: textForMode, instruction });

  const systemPrompt = `${parts.join("\n")}\n\n${modePrompt}`;

  const stream = callAiStream({
    ...config,
    system: systemPrompt,
    messages: [{ role: "user", content: mode === "brainstorm" ? (instruction || "请给出下一步发展方向") : textForMode! }],
    max_tokens: mode === "brainstorm" ? 2048 : 4096,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
