import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncLinks } from "@/lib/notes";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  let session;
  try {
    session = await auth();
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const q = searchParams.get("q");

  let notes;
  try {
    notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        ...(tag ? { tags: { contains: tag } } : {}),
        ...(q ? { OR: [{ title: { contains: q } }, { body: { contains: q } }] } : {}),
      },
      select: { id: true, title: true, tags: true, updatedAt: true, createdAt: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    return NextResponse.json({ error: "数据库查询失败" }, { status: 500 });
  }

  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  let session;
  try {
    session = await auth();
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, body, tags } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
  }

  let note;
  try {
    note = await prisma.note.create({
      data: {
        title: title.trim(),
        body: body || "",
        tags: JSON.stringify(tags || []),
        userId: session.user.id,
      },
    });
    await syncLinks(note.id, body || "");
  } catch {
    return NextResponse.json({ error: "创建笔记失败" }, { status: 500 });
  }

  return NextResponse.json({ id: note.id, title: note.title }, { status: 201 });
}
