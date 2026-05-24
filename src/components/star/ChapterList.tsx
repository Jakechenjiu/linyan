"use client";

import { useState, useRef } from "react";
import { GripVertical, Trash2 } from "lucide-react";

interface ChapterItem {
  id: string;
  title: string;
  order: number;
  wordCount: number;
}

export default function ChapterList({
  novelId,
  chapters: initialChapters,
  totalWords,
  addAction,
  deleteAction,
}: {
  novelId: string;
  chapters: ChapterItem[];
  totalWords: number;
  addAction: (formData: FormData) => Promise<void>;
  deleteAction: (chapterId: string) => Promise<void>;
}) {
  const [items, setItems] = useState(initialChapters);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  };

  const handleDrop = async (idx: number) => {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }

    const reordered = [...items];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setItems(reordered);
    setDragIdx(null);
    setOverIdx(null);

    // Persist to server
    await fetch(`/api/novels/${novelId}/chapters/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: reordered.map((ch) => ch.id) }),
    });
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  return (
    <div className="w-64 shrink-0 space-y-3 overflow-y-auto pr-2">
      <p className="text-xs text-muted-foreground">
        {items.length} 章 · {totalWords.toLocaleString()} 字
      </p>

      <form action={addAction} className="space-card rounded-xl p-3">
        <input
          name="title"
          placeholder="新章节标题…"
          className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-card-border text-xs focus:outline-none focus:border-[var(--cyan)] transition-colors"
        />
        <button
          type="submit"
          className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--cyan-soft)] text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-[#0a0e17] transition-all"
        >
          添加章节
        </button>
      </form>

      <div className="space-y-1">
        {items.map((ch, idx) => (
          <div
            key={ch.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            className={`space-card rounded-lg p-2.5 group cursor-default transition-all ${
              dragIdx === idx ? "opacity-50" : ""
            } ${overIdx === idx && dragIdx !== idx ? "border-[var(--cyan)] border" : ""}`}
          >
            <div className="flex items-start gap-1.5">
              <button
                className="mt-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing transition-colors"
                aria-label="拖拽排序"
              >
                <GripVertical size={12} />
              </button>
              <a href={`#chapter-${ch.id}`} className="flex-1 min-w-0">
                <span className="text-[10px] text-muted-foreground">第 {idx + 1} 章</span>
                <p className="text-xs font-medium truncate">{ch.title}</p>
                <span className="text-[10px] text-muted-foreground">{ch.wordCount} 字</span>
              </a>
              <form action={deleteAction.bind(null, ch.id)}>
                <button className="p-0.5 rounded text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={12} />
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
