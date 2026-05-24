import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mindmaps = await prisma.mindMap.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(mindmaps);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, markdown } = await req.json();
  const nodeCount = (markdown?.match(/^#+\s/gm) || []).length;

  const mindmap = await prisma.mindMap.create({
    data: {
      title: title?.trim() ?? "未命名脑图",
      markdown: markdown ?? "",
      nodeCount,
      userId: session.user.id,
    },
  });
  return NextResponse.json(mindmap, { status: 201 });
}
