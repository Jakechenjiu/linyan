import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { initializeAllCharacterAgents } from "@/lib/character-agent/init";
import { parsePersonality, parseFingerprint, parseState, parseConstraints } from "@/lib/character-agent/parsers";

// GET: 获取小说的所有角色 Agent 数据
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

  const characters = await prisma.character.findMany({
    where: { novelId },
    include: {
      _count: { select: { memories: true, knowledge: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  const agents = characters.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    tagline: c.tagline,
    personality: parsePersonality(c),
    languageFingerprint: parseFingerprint(c),
    agentState: parseState(c),
    behaviorConstraints: parseConstraints(c),
    memoryCount: c._count.memories,
    knowledgeCount: c._count.knowledge,
    hasAgentData: c.openness != null,
  }));

  return NextResponse.json({ agents });
}

// POST: 初始化所有角色的 Agent 数据
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

  try {
    const count = await initializeAllCharacterAgents(novelId);
    return NextResponse.json({ message: `已初始化 ${count} 个角色的 Agent 数据`, count });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "初始化失败" }, { status: 500 });
  }
}
