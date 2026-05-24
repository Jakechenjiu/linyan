import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncLinks, getBacklinks } from "@/lib/notes";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await auth();
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let note;
  try {
    note = await prisma.note.findUnique({ where: { id } });
  } catch {
    return NextResponse.json({ error: "数据库查询失败" }, { status: 500 });
  }

  if (!note || note.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let backlinks: Awaited<ReturnType<typeof getBacklinks>> = [];
  try {
    backlinks = await getBacklinks(id);
  } catch {
    backlinks = [];
  }

  return NextResponse.json({ ...note, backlinks });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await auth();
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let note;
  try {
    note = await prisma.note.findUnique({ where: { id } });
  } catch {
    return NextResponse.json({ error: "数据库查询失败" }, { status: 500 });
  }

  if (!note || note.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { title, body, tags } = await req.json();

  try {
    const updated = await prisma.note.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(body !== undefined ? { body } : {}),
        ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
      },
    });
    if (body !== undefined) {
      await syncLinks(id, body);
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "更新笔记失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await auth();
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.note.deleteMany({ where: { id, userId: session.user.id } });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
