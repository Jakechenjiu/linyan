import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getBacklinks } from "@/lib/notes";
import NoteEditorClient from "./NoteEditorClient";

export default async function NoteEditPage({ params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await auth();
  } catch {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">认证服务异常，请稍后重试</p>
      </div>
    );
  }
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  if (id === "new") {
    return <NoteEditorClient />;
  }

  let note;
  try {
    note = await prisma.note.findUnique({ where: { id } });
  } catch {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">数据库查询失败</p>
      </div>
    );
  }

  if (!note || note.userId !== session.user.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">笔记不存在</p>
      </div>
    );
  }

  let backlinks: Awaited<ReturnType<typeof getBacklinks>> = [];
  try {
    backlinks = await getBacklinks(id);
  } catch {
    backlinks = [];
  }

  let tags: string[] = [];
  try {
    const p = JSON.parse(note.tags || "[]");
    if (Array.isArray(p)) tags = p;
  } catch {}

  return (
    <NoteEditorClient
      initialId={note.id}
      initialTitle={note.title}
      initialBody={note.body}
      initialTags={tags}
      initialBacklinks={backlinks}
    />
  );
}
