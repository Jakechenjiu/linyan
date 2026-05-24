import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contents = await prisma.content.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(contents);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, platform, contentType, status } = await req.json();
  const content = await prisma.content.create({
    data: {
      title: title?.trim() ?? "未命名",
      body: body ?? "",
      platform: platform ?? "wechat",
      contentType: contentType ?? "article",
      wordCount: (body ?? "").length,
      status: status ?? "draft",
      isPublic: status === "published",
      userId: session.user.id,
    },
  });
  return NextResponse.json(content, { status: 201 });
}
