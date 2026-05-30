"use client";

import { useState } from "react";
import { GripVertical, Trash2, Plus, Check } from "lucide-react";
import { toast } from "sonner";

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
  addAction: (formData: FormData) => Promise<{ ok: boolean; error?: string; title?: string }>;
  deleteAction: (chapterId: string) => Promise<void>;
}) {
  const [items, setItems] = useState(initialChapters);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [insertAfterId, setInsertAfterId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setOverIdx(idx); };

  const handleDrop = async (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return; }
    const reordered = [...items];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setItems(reordered);
    setDragIdx(null);
    setOverIdx(null);
    await fetch(`/api/novels/${novelId}/chapters/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: reordered.map((ch) => ch.id) }),
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const formData = new FormData();
    formData.set("title", newTitle.trim());
    if (insertAfterId) formData.set("afterChapterId", insertAfterId);
    const result = await addAction(formData);
    if (result.ok) {
      toast.success(`章节「${result.title}」已创建`);
      setNewTitle("");
      setInsertAfterId(null);
      const newChapter: ChapterItem = { id: Math.random().toString(36).slice(2) + Date.now().toString(36), title: result.title!, order: 0, wordCount: 0 };
      if (insertAfterId) {
        const idx = items.findIndex((ch) => ch.id === insertAfterId);
        const updated = [...items];
        updated.splice(idx + 1, 0, newChapter);
        setItems(updated);
      } else {
        setItems([...items, newChapter]);
      }
    } else {
      toast.error(result.error || "创建失败");
    }
  };

  const handleStartEdit = (ch: ChapterItem) => {
    setEditingId(ch.id);
    setEditingTitle(ch.title);
  };

  const handleSaveEdit = async (chId: string) => {
    if (!editingTitle.trim()) { setEditingId(null); return; }
    setItems((prev) => prev.map((ch) => ch.id === chId ? { ...ch, title: editingTitle.trim() } : ch));
    setEditingId(null);
    await fetch(`/api/chapters/${chId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editingTitle.trim() }),
    });
    toast.success("标题已更新");
  };

  return (
    <div className="w-64 shrink-0 space-y-3 overflow-y-auto pr-2">
      <p className="text-xs text-muted-foreground">
        {items.length} 章 · {totalWords.toLocaleString()} 字
      </p>

      <form onSubmit={handleSubmit} className="space-card rounded-xl p-3">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder={insertAfterId ? "在选中章节后插入…" : "新章节标题…"}
          className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-card-border text-xs focus:outline-none focus:border-[var(--cyan)] transition-colors"
        />
        <div className="flex gap-1.5 mt-2">
          <button type="submit"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--cyan-soft)] text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-[#0a0e17] transition-all">
            {insertAfterId ? "插入章节" : "添加章节"}
          </button>
          {insertAfterId && (
            <button type="button" onClick={() => setInsertAfterId(null)}
              className="px-2 py-1.5 rounded-lg text-[10px] text-muted-foreground hover:text-foreground border border-card-border transition-colors">
              取消
            </button>
          )}
        </div>
      </form>

      <div className="space-y-1">
        {items.map((ch, idx) => (
          <div
            key={ch.id}
            draggable={editingId !== ch.id}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
            className={`space-card rounded-lg p-2.5 group cursor-default transition-all ${
              dragIdx === idx ? "opacity-50" : ""
            } ${overIdx === idx && dragIdx !== idx ? "border-[var(--cyan)] border" : ""} ${
              insertAfterId === ch.id ? "ring-1 ring-[var(--cyan)]" : ""
            }`}
          >
            <div className="flex items-start gap-1.5">
              <button className="mt-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing transition-colors"
                aria-label="拖拽排序">
                <GripVertical size={12} />
              </button>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-muted-foreground">第 {idx + 1} 章</span>
                {editingId === ch.id ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(ch.id); if (e.key === "Escape") setEditingId(null); }}
                      className="flex-1 px-1.5 py-0.5 rounded bg-[var(--background)] border border-[var(--cyan)] text-xs focus:outline-none"
                      autoFocus
                    />
                    <button onClick={() => handleSaveEdit(ch.id)} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                      <Check size={12} />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs font-medium truncate cursor-text hover:text-[var(--cyan)] transition-colors"
                    onClick={() => handleStartEdit(ch)} title="点击编辑标题">
                    {ch.title}
                  </p>
                )}
                <span className="text-[10px] text-muted-foreground">{ch.wordCount} 字</span>
              </div>

              <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setInsertAfterId(ch.id)}
                  className="p-0.5 rounded text-muted-foreground hover:text-[var(--cyan)] transition-colors" title="在此章后插入">
                  <Plus size={12} />
                </button>
                <form action={deleteAction.bind(null, ch.id)}>
                  <button className="p-0.5 rounded text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
