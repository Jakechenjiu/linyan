import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAi } from "@/lib/ai";
import { NextResponse } from "next/server";

const reviewSystemPrompt = `你是一位专业的网文编辑，负责审查章节质量。请以严格的JSON格式返回审查结果。

## 审查维度

1. **角色一致性** (character_consistency): 角色行为是否符合已设定的人格、欲望、缺陷？
2. **设定一致性** (setting_consistency): 是否违反世界观规则、力量体系、世界铁律？
3. **叙事连贯性** (narrative_coherence): 与前后章节的衔接是否自然？有无逻辑跳跃？
4. **节奏** (pacing): 是否有停滞感？爽点/信息/情感交付密度如何？
5. **AI味检测** (ai_flavor): 检查以下AI写作特征：
   - 高频AI词汇："缓缓/淡淡/微微/轻轻"密度
   - 段落结尾总结反思句（"他知道，…"、"这一刻，…"）
   - "起因→经过→结果→感悟"四段式闭合结构
   - 标签化情绪表达（"他感到X"）
   - 对话缺乏潜台词和冲突（信息播报式对话）
   - 连续3句以上相同句式
   - 每段都以句号平稳结束，没有未解决的张力

## 输出格式

严格返回以下JSON（不要包含markdown代码块标记）：

{
  "overall": "pass" | "warning" | "fail",
  "summary": "一句话总评（不超过50字）",
  "issues": [
    {
      "severity": "critical" | "high" | "medium" | "low",
      "category": "character_consistency" | "setting_consistency" | "narrative_coherence" | "pacing" | "ai_flavor",
      "location": "章节中具体位置描述",
      "description": "问题描述",
      "fixHint": "修改建议（一句话）"
    }
  ],
  "strengths": ["做得好的地方1", "做得好的地方2"]
}

如果没有发现问题，issues 为空数组，overall 为 "pass"。
critical = 必须修改才能发布
high = 强烈建议修改
medium = 建议优化
low = 可选优化`;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const { chapterId } = await req.json();

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      worldSetting: true,
      characters: { orderBy: { sortOrder: "asc" } },
      chapters: { orderBy: { order: "asc" } },
    },
  });
  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const chapter = novel.chapters.find((ch) => ch.id === chapterId);
  if (!chapter) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });

  const config = await getAiConfig(session.user.id);

  if (!config.hasKey) {
    return NextResponse.json({
      error: "请先在设置中配置您的 AI API Key",
      code: "NO_API_KEY",
    }, { status: 400 });
  }

  // Build context
  const context: string[] = [];
  context.push(`小说: ${novel.title}`);
  if (novel.genre) context.push(`类型: ${novel.genre}`);

  if (novel.characters.length > 0) {
    context.push("\n角色设定:");
    for (const c of novel.characters) {
      const fields = [`${c.name}(${c.role})`];
      if (c.desire) fields.push(`欲望:${c.desire}`);
      if (c.flaw) fields.push(`缺陷:${c.flaw}`);
      if (c.personality) fields.push(`性格:${c.personality}`);
      context.push(`- ${fields.join(" | ")}`);
    }
  }

  if (novel.worldSetting?.rules) {
    context.push(`\n世界铁律:\n${novel.worldSetting.rules}`);
  }

  // Find adjacent chapters for continuity check
  const chIdx = novel.chapters.findIndex((c) => c.id === chapterId);
  const prevChapter = chIdx > 0 ? novel.chapters[chIdx - 1] : null;
  const nextChapter = chIdx < novel.chapters.length - 1 ? novel.chapters[chIdx + 1] : null;

  const userMessage = `${context.join("\n")}

${prevChapter ? `前一章结尾 (${prevChapter.title}): ${prevChapter.body.slice(-500)}` : "(这是第一章)"}

待审查章节 (${chapter.title}):
${chapter.body}

${nextChapter ? `后一章开头 (${nextChapter.title}): ${nextChapter.body.slice(0, 300)}` : "(这是最后一章)"}

请审查以上章节。`;

  let content: string;
  try {
    content = await callAi({
      ...config,
      system: reviewSystemPrompt,
      messages: [{ role: "user", content: userMessage }],
      max_tokens: 2048,
      temperature: 0.2,
    });
  } catch (e) {
    console.error("Review AI error:", e);
    return NextResponse.json({
      overall: "fail",
      summary: e instanceof Error ? e.message : "AI 调用失败",
      issues: [],
      strengths: [],
    });
  }

  // Try parsing JSON from response
  let review;
  try {
    const jsonStr = content.replace(/```json\s?|\```/g, "").trim();
    review = JSON.parse(jsonStr);
  } catch {
    review = {
      overall: "warning",
      summary: "审查结果解析失败，请重试",
      issues: [{ severity: "medium", category: "ai_flavor", location: "全文", description: "无法自动审查，请人工检查", fixHint: "" }],
      strengths: [],
    };
  }

  return NextResponse.json(review);
}
