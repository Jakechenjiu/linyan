import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAi } from "@/lib/ai";
import { NextResponse } from "next/server";

const AUDIT_PROMPT = `你是一位资深文学编辑和AIGC检测专家。请对以下文本进行10维度AI味审计。

审计维度（每项0-10分，0=无人工痕迹，10=严重AI味）：

1. significance_inflation — 意义膨胀（"标志着"、"象征着"、"反映着"）
2. tricolon — 三段式排比（X、Y、Z结构）
3. paragraph_arc — 段落弧度雷同（每段主题句→展开→总结）
4. ai_vocabulary — AI高频词汇（缓缓/淡淡/微微/轻轻/蓦然）
5. vague_attribution — 模糊归因（专家认为/研究表明）
6. dialogue_completeness — 对话完整性（信息广播式对话）
7. concrete_anchors — 具体锚点（缺少专有名词/数字/感官细节）
8. sentence_rhythm — 句式节奏（缺乏长短句交替）
9. emotional_labeling — 情感标签化（"他感到悲伤"而非身体反应）
10. structural_regularity — 结构规律性（过于整洁，无不规则性）

请严格按以下JSON格式输出，不要输出其他内容：
{
  "overallScore": 0-100,
  "dimensions": {
    "significance_inflation": 0-10,
    "tricolon": 0-10,
    "paragraph_arc": 0-10,
    "ai_vocabulary": 0-10,
    "vague_attribution": 0-10,
    "dialogue_completeness": 0-10,
    "concrete_anchors": 0-10,
    "sentence_rhythm": 0-10,
    "emotional_labeling": 0-10,
    "structural_regularity": 0-10
  },
  "issues": [
    {
      "line": "问题所在段落的前几个字",
      "text": "问题原文",
      "problem": "问题类型",
      "fix": "修改建议"
    }
  ],
  "summary": "整体评价（1-2句话）"
}`;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const { chapterId, text } = await req.json();

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { userId: true },
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
    const result = await callAi({
      ...config,
      system: AUDIT_PROMPT,
      messages: [{ role: "user", content: `请审计以下文本：\n\n${auditText.slice(0, 6000)}` }],
      max_tokens: 2000,
      temperature: 0.3,
    });

    // Parse JSON from response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "审计结果解析失败" }, { status: 500 });
    }

    const audit = JSON.parse(jsonMatch[0]);
    return NextResponse.json(audit);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "审计失败" },
      { status: 500 }
    );
  }
}
