import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ingestNovelToNotes, ingestContentToNotes } from "@/lib/notes/auto-ingest";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, id } = await req.json();

  if (!type || !id) {
    return NextResponse.json({ error: "type and id required" }, { status: 400 });
  }

  try {
    let result;
    if (type === "novel") {
      result = await ingestNovelToNotes(id, session.user.id);
    } else if (type === "content") {
      result = await ingestContentToNotes(id, session.user.id);
    } else {
      return NextResponse.json({ error: "Invalid type. Use 'novel' or 'content'" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `归纳完成：创建 ${result?.created || 0} 条，更新 ${result?.updated || 0} 条`,
      result,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "归纳失败" },
      { status: 500 }
    );
  }
}
