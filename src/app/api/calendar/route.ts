import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.content.findMany({
    where: { userId: session.user.id, status: "scheduled" },
    orderBy: { updatedAt: "asc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, platform } = await req.json();
  const content = await prisma.content.create({
    data: {
      title: title?.trim() ?? "未命名",
      body: "",
      platform: platform ?? "wechat",
      contentType: "article",
      wordCount: 0,
      status: "scheduled",
      userId: session.user.id,
    },
  });
  return NextResponse.json(content, { status: 201 });
}
