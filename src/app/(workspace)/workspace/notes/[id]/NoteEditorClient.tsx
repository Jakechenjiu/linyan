"use client";

import { useRouter } from "next/navigation";
import NoteEditor from "@/components/notes/NoteEditor";
import type { NoteLink } from "@/components/notes/BacklinksPanel";

interface Props {
  initialId?: string;
  initialTitle?: string;
  initialBody?: string;
  initialTags?: string[];
  initialBacklinks?: { id: string; fromId: string; fromNote: { id: string; title: string } }[];
}

export default function NoteEditorClient({
  initialId,
  initialTitle,
  initialBody,
  initialTags,
  initialBacklinks = [],
}: Props) {
  const router = useRouter();

  const handleSave = async (data: { title: string; body: string; tags: string[] }) => {
    if (initialId) {
      const res = await fetch(`/api/notes/${initialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        router.refresh();
      }
    } else {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const note = await res.json();
        router.push(`/workspace/notes/${note.id}`);
        router.refresh();
      }
    }
  };

  const handleDelete = async () => {
    if (!initialId) return;
    const res = await fetch(`/api/notes/${initialId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/workspace/notes");
      router.refresh();
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-mono text-2xl font-bold tracking-wide">
          {initialId ? "编辑笔记" : "新建笔记"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          使用 [[笔记名]] 创建双向链接
        </p>
      </div>
      <div className="space-card rounded-2xl p-6">
        <NoteEditor
          id={initialId}
          initialTitle={initialTitle}
          initialBody={initialBody}
          initialTags={initialTags}
          backlinks={initialBacklinks}
          onSave={handleSave}
          onDelete={initialId ? handleDelete : undefined}
        />
      </div>
    </div>
  );
}
