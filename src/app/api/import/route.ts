import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { importNotes } from "@/lib/importers/notes";
import { importNovel } from "@/lib/importers/novel";
import { importContent } from "@/lib/importers/content";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  let session;
  try {
    session = await auth();
  } catch {
    return NextResponse.json({ error: "认证失败" }, { status: 500 });
  }
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "notes";

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "无效的文件上传" }, { status: 400 });
  }

  const files: { name: string; content: string }[] = [];
  const entries = Array.from(formData.entries());

  for (const [, value] of entries) {
    if (value instanceof File) {
      if (value.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `文件 ${value.name} 超过 10MB 限制` },
          { status: 413 }
        );
      }
      try {
        const content = await value.text();
        files.push({ name: value.name, content });
      } catch {
        return NextResponse.json(
          { error: `无法读取文件 ${value.name}` },
          { status: 400 }
        );
      }
    }
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "未选择文件" }, { status: 400 });
  }

  try {
    let count = 0;

    switch (type) {
      case "notes":
        count = await importNotes(session.user.id, files);
        break;
      case "novel":
        count = await importNovel(session.user.id, files);
        break;
      case "content":
        count = await importContent(session.user.id, files);
        break;
      case "seed":
        // Return text content for wanxiang, don't write to DB
        return NextResponse.json({
          content: files.map((f) => f.content).join("\n\n---\n\n"),
          fileName: files[0]?.name || "",
          count: files.length,
        });
      default:
        return NextResponse.json({ error: `未知导入类型: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, count });
  } catch (e) {
    console.error("Import error:", e);
    return NextResponse.json(
      { error: `导入失败: ${e instanceof Error ? e.message : "未知错误"}` },
      { status: 500 }
    );
  }
}
