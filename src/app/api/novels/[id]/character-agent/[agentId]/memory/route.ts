import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { recallMemories, storeMemory } from "@/lib/character-agent/memory";

// GET: 获取角色记忆
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; agentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: novelId, agentId } = await params;

  // 验证权限
  const character = await prisma.character.findFirst({
    where: { id: agentId, novelId, novel: { userId: session.user.id } },
  });
  if (!character) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") as any;
  const minImportance = parseFloat(url.searchParams.get("minImportance") || "0");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const memories = await recallMemories(agentId, {
    type: type || undefined,
    minImportance,
    limit,
  });

  return NextResponse.json({ memories });
}

// POST: 添加一条记忆
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; agentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: novelId, agentId } = await params;

  const character = await prisma.character.findFirst({
    where: { id: agentId, novelId, novel: { userId: session.user.id } },
  });
  if (!character) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { type, content, importance, emotionTag, tags, chapterId } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  }

  try {
    const memory = await storeMemory(agentId, {
      type: type || "experience",
      content: content.trim(),
      importance: importance ?? 0.5,
      emotionTag,
      tags,
      chapterId,
    });
    return NextResponse.json({ memory }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "添加失败" },
      { status: 500 }
    );
  }
}
