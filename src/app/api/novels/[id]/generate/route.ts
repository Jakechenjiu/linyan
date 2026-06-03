import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAiStream } from "@/lib/ai";
import { NextResponse } from "next/server";
import { getAllTruthFiles, buildTruthFileContext } from "@/lib/truth-files";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const { chapterId, direction } = await req.json();

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      worldSetting: true,
      characters: { orderBy: { sortOrder: "asc" } },
      chapters: { orderBy: { order: "desc" }, take: 3 },
      outlines: true,
      codexEntries: true,
    },
  });

  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If chapter has an associated outline, use it for context
  let outlineSummary: string | null = null;
  if (chapterId) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { outlineId: true },
    });
    if (chapter?.outlineId) {
      const outline = novel.outlines.find((o) => o.id === chapter.outlineId);
      if (outline?.summary) outlineSummary = outline.summary;
    }
  }

  const config = await getAiConfig(session.user.id);

  if (!config.hasKey) {
    return NextResponse.json({
      error: "请先在设置中配置您的 AI API Key",
      code: "NO_API_KEY",
    }, { status: 400 });
  }

  // Build context
  const parts: string[] = [];

  parts.push(`# 小说: ${novel.title}`);
  if (novel.genre) parts.push(`类型: ${novel.genre}`);
  if (novel.synopsis) parts.push(`简介: ${novel.synopsis}`);

  // Characters
  if (novel.characters.length > 0) {
    parts.push("\n## 角色设定");
    for (const c of novel.characters) {
      const fields: string[] = [`- ${c.name}(${c.role})`];
      if (c.tagline) fields.push(`称号: ${c.tagline}`);
      if (c.desire) fields.push(`欲望: ${c.desire}`);
      if (c.flaw) fields.push(`缺陷: ${c.flaw}`);
      if (c.goldenFinger) fields.push(`金手指: ${c.goldenFinger}`);
      if (c.personality) fields.push(`性格: ${c.personality}`);
      parts.push(fields.join(" | "));
    }
  }

  // World
  if (novel.worldSetting) {
    const ws = novel.worldSetting;
    parts.push("\n## 世界观");
    if (ws.worldType) parts.push(`世界类型: ${ws.worldType}`);
    if (ws.powerSystem) parts.push(`力量体系:\n${ws.powerSystem}`);
    if (ws.rules) parts.push(`世界铁律:\n${ws.rules}`);
  }

  // Prior chapters

  // Codex entries — keyword-matched context injection
  if (novel.codexEntries.length > 0) {
    const chapter = chapterId ? novel.chapters.find((ch) => ch.id === chapterId) : null;
    const contextText = (chapter?.title || "") + " " + (chapter?.body?.slice(-1000) || "");

    const matched = novel.codexEntries.filter((entry) => {
      const keywords: string[] = JSON.parse(entry.keywords || "[]");
      if (keywords.length === 0) return entry.type === "world_rule";
      return keywords.some((kw) => contextText.includes(kw));
    });

    if (matched.length > 0) {
      parts.push("\n## 素材参考");
      for (const entry of matched) {
        parts.push(`- [${entry.type}] ${entry.name}: ${entry.summary || entry.body?.slice(0, 200) || ""}`);
      }
    }
  }

  // Truth files — inject long-term memory
  try {
    const truthFiles = await getAllTruthFiles(novelId);
    const truthContext = buildTruthFileContext(truthFiles, { maxLength: 6000 });
    if (truthContext.trim()) {
      parts.push(`\n## 长期记忆（真相文件）\n${truthContext}`);
    }
  } catch (e) {
    console.warn("Failed to load truth files:", e);
  }

  const relevantChapters = novel.chapters
    .filter((ch) => !chapterId || ch.id === chapterId)
    .reverse();
  if (relevantChapters.length > 0) {
    parts.push("\n## 已有章节");
    for (const ch of relevantChapters) {
      parts.push(`\n### ${ch.title}\n${ch.body.slice(-2000)}`);
    }
  }

  // Add outline context if available
  if (outlineSummary) {
    parts.push(`\n## 本章大纲摘要\n${outlineSummary}`);
  }

  const systemPrompt = `你是一位专业的网络小说作家。根据以下设定和已有内容，续写小说。要求：

1. 严格遵循角色设定（性格、欲望、缺陷、金手指）
2. 遵守世界观规则，不打破已设定的铁律
3. 保持与已有内容一致的叙事风格和节奏
4. 如果有大纲摘要，严格围绕大纲展开
5. 避免AI味表达：
   - 禁止使用"缓缓/淡淡/微微/轻轻/蓦然/倏忽/仿若/似是/不知为何/莫名"等万用副词
   - 禁止段落结尾的总结反思句（如"他知道，…"、"这一刻，…"、"从此以后…"）
   - 禁止"起因→经过→结果→感悟"四段式闭合结构
   - 用生理反应+微动作替代"他感到X"
   - 对话要有潜台词和意图冲突，允许打断、沉默、回避
   - 禁止连续3句以上相同句式
   - 章节结尾不要平稳落地，留下未解决的问题
6. 如果提供了方向，按方向续写；否则自然推进剧情
7. 续写字数控制在500-1500字
8. 直接从正文开始，禁止"好的，以下是…"等开场白`;

  const userMessage = `${parts.join("\n")}\n\n${direction ? `续写方向：${direction}` : "请续写下一段内容"}`;

  const stream = callAiStream({
    ...config,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    max_tokens: 4096,
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
