import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAiStream } from "@/lib/ai";
import { ANTI_AI_RULES } from "@/lib/prompts";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const { chapterId, message, bodyText, history } = await req.json();

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      worldSetting: true,
      characters: { orderBy: { sortOrder: "asc" } },
      codexEntries: true,
      outlines: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const config = await getAiConfig(session.user.id);
  if (!config.hasKey) {
    return NextResponse.json({ error: "请先配置 AI API Key" }, { status: 400 });
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
      if (c.personality) fields.push(`性格: ${c.personality}`);
      if (c.desire) fields.push(`欲望: ${c.desire}`);
      if (c.flaw) fields.push(`缺陷: ${c.flaw}`);
      if (c.goldenFinger) fields.push(`金手指: ${c.goldenFinger}`);
      parts.push(fields.join(" | "));
    }
  }

  // World setting
  if (novel.worldSetting) {
    const ws = novel.worldSetting;
    parts.push("\n## 世界观");
    if (ws.worldType) parts.push(`世界类型: ${ws.worldType}`);
    if (ws.powerSystem) parts.push(`力量体系:\n${ws.powerSystem}`);
    if (ws.rules) parts.push(`世界铁律:\n${ws.rules}`);
  }

  // Outlines
  if (novel.outlines.length > 0) {
    parts.push("\n## 大纲");
    for (const outline of novel.outlines.filter((o) => o.type === "volume")) {
      parts.push(`### ${outline.title}`);
      if (outline.summary) parts.push(outline.summary);
    }
  }

  // Codex entries
  if (novel.codexEntries.length > 0) {
    const worldRules = novel.codexEntries.filter((e) => e.type === "world_rule");
    if (worldRules.length > 0) {
      parts.push("\n## 世界规则");
      for (const entry of worldRules) {
        parts.push(`- ${entry.name}: ${entry.summary || entry.body?.slice(0, 200) || ""}`);
      }
    }
  }

  const systemPrompt = `${parts.join("\n")}

## 你的角色
你是灵砚的AI写作助手，一个专业的写作搭档。

## 你的能力
1. **讨论剧情** — 分析剧情走向、给出建议、讨论可能性
2. **角色分析** — 分析角色动机、弧线、一致性
3. **审查正文** — 找出逻辑漏洞、AI味问题、改进空间
4. **下一步建议** — 根据伏笔、角色、大纲给出写作方向
5. **直接改文** — 当作者明确要求时，修改正文

## 规则
${ANTI_AI_RULES}

## 工作方式
1. 先分析，再建议，最后才动手改
2. 改正文前必须先说明改了什么、为什么改
3. 不要自作主张，等作者确认
4. 给建议时要具体，不要泛泛而谈
5. 如果作者只是在讨论/提问，正常回复讨论内容
6. 如果作者要求修改正文，输出修改后的完整正文`;

  // Build messages array
  const messages = [
    ...(history || []).map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" as const : "assistant" as const,
      content: m.content,
    })),
    {
      role: "user" as const,
      content: bodyText
        ? `当前正文：\n${bodyText}\n\n---\n\n${message}`
        : message,
    },
  ];

  const stream = callAiStream({
    ...config,
    system: systemPrompt,
    messages,
    max_tokens: 4096,
  });

  // Wrap stream to emit SSE events
  const encoder = new TextEncoder();
  const wrappedStream = new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text", content: accumulated })}\n\n`));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: String(e) })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(wrappedStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
