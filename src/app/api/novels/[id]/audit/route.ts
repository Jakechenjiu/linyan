import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAi } from "@/lib/ai";
import { NextResponse } from "next/server";
import { AUDIT_DIMENSIONS, buildAuditPrompt } from "@/lib/audit-dimensions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const { chapterId, text } = await req.json();

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { userId: true, characters: true, worldSetting: true },
  });

  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const config = await getAiConfig(session.user.id);
  if (!config.hasKey) {
    return NextResponse.json({ error: "请先配置 AI API Key" }, { status: 400 });
  }

  // Get text to audit
  let auditText = text;
  if (!auditText && chapterId) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { body: true },
    });
    auditText = chapter?.body;
  }

  if (!auditText || auditText.trim().length < 100) {
    return NextResponse.json({ error: "文本太短，无法审计" }, { status: 400 });
  }

  try {
    // 构建审计上下文
    const contextLines: string[] = [];
    if (novel.characters && novel.characters.length > 0) {
      contextLines.push("角色设定:");
      for (const c of novel.characters) {
        contextLines.push(
          `- ${c.name}(${c.role}): ${c.personality || ""} | 欲望:${c.desire || ""} | 缺陷:${c.flaw || ""}`
        );
      }
    }
    if (novel.worldSetting?.rules) {
      contextLines.push(`\n世界铁律:\n${novel.worldSetting.rules}`);
    }

    const auditPrompt = buildAuditPrompt(AUDIT_DIMENSIONS);

    const result = await callAi({
      ...config,
      system: auditPrompt,
      messages: [
        {
          role: "user",
          content: `${contextLines.join("\n")}\n\n请审计以下文本：\n\n${auditText.slice(0, 8000)}`,
        },
      ],
      max_tokens: 3000,
      temperature: 0.2,
    });

    // Parse JSON from response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "审计结果解析失败" }, { status: 500 });
    }

    const audit = JSON.parse(jsonMatch[0]);

    // 确保返回格式正确
    return NextResponse.json({
      overallScore: audit.overallScore || 0,
      passed: audit.passed !== undefined ? audit.passed : audit.overallScore < 100,
      dimensions: audit.dimensions || {},
      issues: audit.issues || [],
      summary: audit.summary || "审计完成",
      dimensionCount: AUDIT_DIMENSIONS.length,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "审计失败" },
      { status: 500 }
    );
  }
}
