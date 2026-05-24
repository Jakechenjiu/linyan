import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAiStream } from "@/lib/ai";
import { NextResponse } from "next/server";

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
    },
  });
  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const relevantChapters = novel.chapters
    .filter((ch) => !chapterId || ch.id === chapterId)
    .reverse();
  if (relevantChapters.length > 0) {
    parts.push("\n## 已有章节");
    for (const ch of relevantChapters) {
      parts.push(`\n### ${ch.title}\n${ch.body.slice(-2000)}`);
    }
  }

  const systemPrompt = `你是一位专业的网络小说作家。根据以下设定和已有内容，续写小说。要求：

1. 严格遵循角色设定（性格、欲望、缺陷、金手指）
2. 遵守世界观规则，不打破已设定的铁律
3. 保持与已有内容一致的叙事风格和节奏
4. 避免AI味表达：
   - 禁止使用"缓缓/淡淡/微微/轻轻"等万用副词
   - 禁止段落结尾的总结反思句（如"他知道，…"、"这一刻，…"）
   - 禁止"起因→经过→结果→感悟"四段式闭合结构
   - 用生理反应+微动作替代"他感到X"
   - 对话要有潜台词和意图冲突，允许打断、沉默、回避
   - 章节结尾不要平稳落地，留下未解决的问题
5. 如果提供了方向，按方向续写；否则自然推进剧情
6. 续写字数控制在500-1500字`;

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
