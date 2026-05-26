"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, GripVertical, ChevronLeft, ChevronRight, PanelRightClose, PanelRight } from "lucide-react";
import { toast } from "sonner";
import ChatPanel from "./ChatPanel";
import ChapterViewer from "./ChapterViewer";

interface ChapterItem {
  id: string;
  title: string;
  body: string;
  wordCount: number;
  order: number;
  factSnapshot?: string | null;
  outline?: { id: string; summary: string | null } | null;
}

interface Character {
  id: string;
  name: string;
  role: string;
  tagline?: string | null;
  personality?: string | null;
}

interface OutlineVolume {
  id: string;
  title: string;
  summary: string | null;
  children: { id: string; title: string; summary: string | null; chapterId: string | null }[];
}

export default function StarEditorLayout({
  novelId,
  chapters: initialChapters,
  characters,
  outlineVolumes,
  addAction,
  deleteAction,
  saveAction,
}: {
  novelId: string;
  chapters: ChapterItem[];
  characters: Character[];
  outlineVolumes: OutlineVolume[];
  addAction: (formData: FormData) => Promise<{ ok: boolean; error?: string; title?: string }>;
  deleteAction: (chapterId: string) => Promise<void>;
  saveAction: (chapterId: string, title: string, body: string) => Promise<void>;
}) {
  const [chapters, setChapters] = useState(initialChapters);
  const [selectedId, setSelectedId] = useState<string | null>(initialChapters[0]?.id || null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(true);
  const [newTitle, setNewTitle] = useState("");

  const selectedChapter = chapters.find((ch) => ch.id === selectedId) || null;

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const formData = new FormData();
    formData.set("title", newTitle.trim());
    const result = await addAction(formData);
    if (result.ok) {
      toast.success(`章节「${result.title}」已创建`);
      setNewTitle("");
      const newCh: ChapterItem = {
        id: crypto.randomUUID(),
        title: result.title!,
        body: "",
        wordCount: 0,
        order: chapters.length + 1,
      };
      setChapters((prev) => [...prev, newCh]);
      setSelectedId(newCh.id);
    } else {
      toast.error(result.error || "创建失败");
    }
  };

  const handleDeleteChapter = async (id: string) => {
    await deleteAction(id);
    setChapters((prev) => prev.filter((ch) => ch.id !== id));
    if (selectedId === id) {
      setSelectedId(chapters.find((ch) => ch.id !== id)?.id || null);
    }
  };

  const handleBodyChange = useCallback(
    (body: string) => {
      setChapters((prev) =>
        prev.map((ch) => (ch.id === selectedId ? { ...ch, body, wordCount: body.replace(/\s/g, "").length } : ch))
      );
    },
    [selectedId]
  );

  const handleSave = useCallback(async () => {
    if (!selectedChapter) return;
    await saveAction(selectedChapter.id, selectedChapter.title, selectedChapter.body);
  }, [selectedChapter, saveAction]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Chapter Sidebar */}
      <div
        className={`shrink-0 border-r border-card-border flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? "w-10" : "w-56"
        }`}
      >
        <div className="flex items-center justify-between px-2 py-2 border-b border-card-border shrink-0">
          {!sidebarCollapsed && (
            <span className="text-[11px] font-medium text-muted-foreground">
              {chapters.length} 章
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Add chapter form */}
            <form onSubmit={handleAddChapter} className="p-2 border-b border-card-border shrink-0">
              <div className="flex gap-1">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="新章节…"
                  className="flex-1 px-2 py-1 rounded bg-[var(--accent)] border border-card-border text-[11px] focus:outline-none focus:border-[var(--cyan)] transition-colors"
                />
                <button
                  type="submit"
                  className="p-1 rounded text-[var(--cyan)] hover:bg-[var(--cyan-soft)] transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </form>

            {/* Chapter list */}
            <div className="flex-1 overflow-y-auto">
              {chapters.map((ch, idx) => (
                <div
                  key={ch.id}
                  onClick={() => setSelectedId(ch.id)}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer group transition-colors ${
                    selectedId === ch.id
                      ? "bg-[var(--accent)] border-l-2 border-[var(--cyan)]"
                      : "hover:bg-[var(--accent)]/50 border-l-2 border-transparent"
                  }`}
                >
                  <span className="text-[10px] text-muted-foreground/50 w-4 shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate">{ch.title}</p>
                    <p className="text-[9px] text-muted-foreground">{ch.wordCount} 字</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChapter(ch.id);
                    }}
                    className="p-0.5 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Center: Chat Panel */}
      <div className="flex-1 min-w-0 flex flex-col">
        <ChatPanel
          novelId={novelId}
          chapterId={selectedId}
          chapterBody={selectedChapter?.body || ""}
          onBodyChange={handleBodyChange}
          onSave={handleSave}
        />
      </div>

      {/* Right: Chapter Viewer */}
      <div
        className={`shrink-0 border-l border-card-border flex flex-col transition-all duration-200 ${
          viewerOpen ? "w-80" : "w-10"
        }`}
      >
        <div className="flex items-center justify-between px-2 py-2 border-b border-card-border shrink-0">
          {!viewerOpen && (
            <button
              onClick={() => setViewerOpen(true)}
              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <PanelRight size={14} />
            </button>
          )}
          {viewerOpen && (
            <>
              <span className="text-[11px] font-medium text-muted-foreground">章节内容</span>
              <button
                onClick={() => setViewerOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <PanelRightClose size={14} />
              </button>
            </>
          )}
        </div>
        {viewerOpen && (
          <ChapterViewer
            chapter={selectedChapter}
            characters={characters}
            outlineVolumes={outlineVolumes}
          />
        )}
      </div>
    </div>
  );
}
