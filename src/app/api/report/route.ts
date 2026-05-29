import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetType, targetId, reason, description } = await req.json();

  if (!targetType || !targetId || !reason) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  // Validate reason
  const validReasons = ["illegal", "spam", "abuse", "other"];
  if (!validReasons.includes(reason)) {
    return NextResponse.json({ error: "无效的举报原因" }, { status: 400 });
  }

  try {
    await prisma.report.create({
      data: {
        reporterId: session.user.id,
        targetType,
        targetId,
        reason,
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "举报已提交，我们将在24小时内处理",
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "举报失败" },
      { status: 500 }
    );
  }
}
