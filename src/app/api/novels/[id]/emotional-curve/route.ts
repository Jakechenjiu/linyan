import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAiConfig, callAi } from "@/lib/ai";
import { NextResponse } from "next/server";
import { generateDefaultCurve, generateCurveFromDescription, formatCurveForPrompt } from "@/lib/emotional-curve/curve-designer";
import { selectTechniques } from "@/lib/emotional-curve/dimensions";

// 简单速率限制（每用户每 2 分钟 1 次）
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 2 * 60_000;

function checkRateLimit(userId: string): boolean {
  const last = rateLimitMap.get(userId);
  if (last && Date.now() - last < RATE_LIMIT_MS) return false;
  rateLimitMap.set(userId, Date.now());
  return true;
}

// GET: 获取小说的情感曲线
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { userId: true },
  });
  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const curves = await prisma.emotionalCurve.findMany({
    where: { novelId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ curves });
}

// POST: 生成情感曲线
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { userId: true },
  });
  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { description, chapterNumber, totalChapters, chapterType } = body;

  const config = await getAiConfig(session.user.id);
  if (!config.hasKey) {
    return NextResponse.json({ error: "请先配置 AI API Key" }, { status: 400 });
  }

  // 速率限制
  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ error: "请等待 2 分钟后再试" }, { status: 429 });
  }

  let design;

  if (description) {
    // 用 AI 根据描述生成曲线
    design = await generateCurveFromDescription(description, (system, user) =>
      callAi({ ...config, system, messages: [{ role: "user", content: user }], max_tokens: 2048, temperature: 0.7 })
    );
  } else {
    // 生成默认曲线
    const curve = generateDefaultCurve(chapterNumber || 1, totalChapters || 100, chapterType);
    const techniques = selectTechniques({
      tension: curve[2]?.tension || 5,
      suspense: curve[2]?.suspense || 5,
      pleasure: curve[2]?.pleasure || 5,
      sadness: curve[2]?.sadness || 5,
      reversal: curve[2]?.reversal || 5,
    });
    design = {
      targetCurve: curve,
      techniques: techniques.map((t) => ({
        segment: [0, 100] as [number, number],
        technique: t.technique,
        reason: t.reason,
        expectedEffect: "",
      })),
      overallTone: "",
      pacingStrategy: "",
    };
  }

  // 保存到数据库
  const saved = await prisma.emotionalCurve.create({
    data: {
      novelId,
      chapterId: body.chapterId || null,
      targetCurve: JSON.stringify(design.targetCurve),
      narrativeTechniques: JSON.stringify(design.techniques),
    },
  });

  return NextResponse.json({
    id: saved.id,
    design,
    promptText: formatCurveForPrompt(design.targetCurve, design.techniques),
  });
}
