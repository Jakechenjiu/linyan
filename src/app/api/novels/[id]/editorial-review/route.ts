import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAi } from "@/lib/ai";
import { NextResponse } from "next/server";
import { runEditorialReview } from "@/lib/editorial-board/board";

// GET: 获取编辑部评审结果
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const url = new URL(req.url);
  const chapterId = url.searchParams.get("chapterId");

  const where: any = { novelId };
  if (chapterId) where.chapterId = chapterId;

  const reviews = await prisma.editorialReview.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ reviews });
}

// POST: 运行编辑部评审
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const { chapterId } = await req.json();

  if (!chapterId) {
    return NextResponse.json({ error: "chapterId required" }, { status: 400 });
  }

  // 验证权限
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { userId: true, title: true, genre: true },
  });
  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 获取章节
  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, novelId },
  });
  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  // 获取角色和世界观
  const [characters, worldSetting] = await Promise.all([
    prisma.character.findMany({
      where: { novelId },
      select: { name: true, role: true, personality: true },
    }),
    prisma.worldSetting.findUnique({
      where: { novelId },
      select: { rules: true },
    }),
  ]);

  const config = await getAiConfig(session.user.id);
  if (!config.hasKey) {
    return NextResponse.json({ error: "请先配置 AI API Key" }, { status: 400 });
  }

  try {
    const result = await runEditorialReview(
      chapter.title,
      chapter.body,
      {
        title: novel.title,
        genre: novel.genre || undefined,
        characters,
        worldRules: worldSetting?.rules || undefined,
      },
      (system, user, temperature) =>
        callAi({
          ...config,
          system,
          messages: [{ role: "user", content: user }],
          max_tokens: 1024,
          temperature: temperature ?? 0.5,
        })
    );

    // 保存到数据库
    const saved = await prisma.editorialReview.upsert({
      where: { novelId_chapterId: { novelId, chapterId } },
      create: {
        novelId,
        chapterId,
        authorReview: JSON.stringify(result.assessments.author),
        editorReview: JSON.stringify(result.assessments.editor),
        chiefReview: JSON.stringify(result.assessments.chief),
        readerReview: JSON.stringify(result.assessments.reader),
        continuityReview: JSON.stringify(result.assessments.continuity),
        debateLog: JSON.stringify(result.debate),
        votes: JSON.stringify(result.votes),
        finalDecision: result.finalDecision,
        chiefRuling: result.chiefRuling,
      },
      update: {
        authorReview: JSON.stringify(result.assessments.author),
        editorReview: JSON.stringify(result.assessments.editor),
        chiefReview: JSON.stringify(result.assessments.chief),
        readerReview: JSON.stringify(result.assessments.reader),
        continuityReview: JSON.stringify(result.assessments.continuity),
        debateLog: JSON.stringify(result.debate),
        votes: JSON.stringify(result.votes),
        finalDecision: result.finalDecision,
        chiefRuling: result.chiefRuling,
      },
    });

    return NextResponse.json({ review: saved, result });
  } catch (e) {
    console.error("[EditorialReview] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "评审失败" },
      { status: 500 }
    );
  }
}
