import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { queryKnowledge, storeKnowledge } from "@/lib/character-agent/knowledge";

// GET: 获取角色知识
export async function GET(
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

  const url = new URL(req.url);
  const type = url.searchParams.get("type") as any;
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const knowledge = await queryKnowledge(agentId, {
    type: type || undefined,
    limit,
  });

  return NextResponse.json({ knowledge });
}

// POST: 添加一条知识
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
  const { type, content, source, acquiredAt, isSecret } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  }

  try {
    const entry = await storeKnowledge(agentId, {
      type: type || "event",
      content: content.trim(),
      source,
      acquiredAt,
      isSecret,
    });
    return NextResponse.json({ knowledge: entry }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "添加失败" },
      { status: 500 }
    );
  }
}
