import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getAllTruthFiles, TRUTH_FILE_TYPES } from "@/lib/truth-files";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;

  // 验证权限
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { userId: true },
  });

  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // 从数据库读取真相文件
    const truthFiles = await prisma.truthFile.findMany({
      where: { novelId },
      orderBy: { type: "asc" },
    });

    // 格式化返回
    const files = TRUTH_FILE_TYPES.map((type) => {
      const file = truthFiles.find((f) => f.type === type);
      return {
        type,
        content: file?.content || "",
        version: file?.version || 0,
        updatedAt: file?.updatedAt || null,
      };
    });

    return NextResponse.json({ files });
  } catch (e) {
    console.error("Failed to load truth files:", e);
    return NextResponse.json(
      { error: "Failed to load truth files" },
      { status: 500 }
    );
  }
}
