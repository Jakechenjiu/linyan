"use client";

import Link from "next/link";

export interface NoteLink {
  id: string;
  fromId: string;
  fromNote: { id: string; title: string };
}

interface Props {
  backlinks: NoteLink[];
}

export default function BacklinksPanel({ backlinks }: Props) {
  if (backlinks.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-card-border">
      <h4 className="text-xs font-medium text-muted-foreground mb-2">
        引用此笔记 ({backlinks.length})
      </h4>
      <div className="space-y-1">
        {backlinks.map((bl) => (
          <Link
            key={bl.id}
            href={`/workspace/notes/${bl.fromNote.id}`}
            className="block text-xs text-[var(--cyan)] hover:underline"
          >
            {bl.fromNote.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
