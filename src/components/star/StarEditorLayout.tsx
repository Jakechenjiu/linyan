"use client";

import { useState, useCallback } from "react";
import {
  Plus, Trash2, ChevronLeft, ChevronRight, ChevronDown,
  PanelRightClose, PanelRight, BookOpen,
  Save, Check, Loader2, Shield, Database, Target, RefreshCw, Users, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import AuditPanel from "./AuditPanel";
import TruthFilesPanel from "./TruthFilesPanel";
import ChapterIntentPanel from "./ChapterIntentPanel";
import InlineAIToolbar from "./InlineAIToolbar";
import CharacterAgentPanel from "./CharacterAgentPanel";
import EmotionalCurvePanel from "./EmotionalCurvePanel";
import EditorialBoardPanel from "./EditorialBoardPanel";
import { toast } from "sonner";
import ChatPanel from "./ChatPanel";
import { fadeIn, slideUp, buttonPress } from "@/lib/animations";

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
  const [editingBody, setEditingBody] = useState(false);
  const [editedBody, setEditedBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [rightPanel, setRightPanel] = useState<"audit" | "truth" | "intent" | "agents" | "curve" | "editorial">("audit");
  const [refreshTruthFiles, setRefreshTruthFiles] = useState(0);
  const [chapterIntent, setChapterIntent] = useState<any>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [inlineAI, setInlineAI] = useState<{
    selectedText: string;
    position: { x: number; y: number };
  } | null>(null);

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
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
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
    // 确认删除
    if (pendingDelete !== id) {
      setPendingDelete(id);
      setTimeout(() => setPendingDelete(null), 3000);
      return;
    }

    await deleteAction(id);
    setChapters((prev) => prev.filter((ch) => ch.id !== id));
    if (selectedId === id) {
      setSelectedId(chapters.find((ch) => ch.id !== id)?.id || null);
    }
    setPendingDelete(null);
    toast.success("章节已删除");
  };

  const handleBodyChange = useCallback(
    (body: string) => {
      setChapters((prev) =>
        prev.map((ch) => (ch.id === selectedId ? { ...ch, body, wordCount: body.replace(/\s/g, "").length } : ch))
      );
      setSaved(false);
    },
    [selectedId]
  );

  const handleSave = useCallback(async (bodyOverride?: string) => {
    if (!selectedChapter) return;
    const bodyToSave = bodyOverride || selectedChapter.body;
    setSaving(true);
    await saveAction(selectedChapter.id, selectedChapter.title, bodyToSave);
    setSaving(false);
    setSaved(true);
  }, [selectedChapter, saveAction]);

  const handleSaveClick = useCallback(() => {
    handleSave();
  }, [handleSave]);

  const handleStartEdit = () => {
    if (selectedChapter) {
      setEditedBody(selectedChapter.body);
      setEditingBody(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedChapter) return;
    setSaving(true);
    setChapters((prev) =>
      prev.map((ch) => (ch.id === selectedId ? { ...ch, body: editedBody, wordCount: editedBody.replace(/\s/g, "").length } : ch))
    );
    await saveAction(selectedChapter.id, selectedChapter.title, editedBody);
    setSaving(false);
    setSaved(true);
    setEditingBody(false);
    toast.success("已保存");
  };

  const handleCancelEdit = () => {
    setEditingBody(false);
    setEditedBody("");
  };

  // 管线意图回调
  const handlePipelineResult = useCallback((result: any) => {
    if (result?.intent) setChapterIntent(result.intent);
    setRefreshTruthFiles((n) => n + 1);
  }, []);

  // 刷新当前章节内容
  const [refreshing, setRefreshing] = useState(false);
  const handleRefreshChapter = useCallback(async () => {
    if (!selectedId || refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/novels/${novelId}/chapters/${selectedId}`);
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setChapters((prev) =>
        prev.map((ch) =>
          ch.id === selectedId
            ? { ...ch, body: data.body, wordCount: data.wordCount || data.body.replace(/\s/g, "").length }
            : ch
        )
      );
      toast.success("已刷新");
    } catch {
      toast.error("刷新失败");
    } finally {
      setRefreshing(false);
    }
  }, [novelId, selectedId, refreshing]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ===== Left: Chapter Sidebar ===== */}
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
            <form onSubmit={handleAddChapter} className="px-2 pt-2 pb-1.5 border-b border-card-border shrink-0">
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
            <div className="flex-1 overflow-y-auto py-0.5">
              {chapters.map((ch, idx) => (
                <div
                  key={ch.id}
                  onClick={() => {
                    setSelectedId(ch.id);
                    setEditingBody(false);
                  }}
                  className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
                    selectedId === ch.id
                      ? "bg-[var(--accent)]"
                      : "hover:bg-[var(--accent)]/50"
                  }`}
                >
                  <span className="text-[10px] text-muted-foreground/40 w-4 shrink-0 tabular-nums">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate">{ch.title}</p>
                    <p className="text-[9px] text-muted-foreground/60">{ch.wordCount} 字</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChapter(ch.id);
                    }}
                    className={`p-0.5 rounded transition-all ${
                      pendingDelete === ch.id
                        ? "text-red-400 bg-red-500/20"
                        : "text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100"
                    }`}
                    title={pendingDelete === ch.id ? "再次点击确认删除" : "删除"}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>

            {/* Reference notes */}
            <div className="px-2 py-1.5 border-t border-card-border shrink-0">
              <Link
                href="/workspace/notes"
                className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-muted-foreground hover:text-[var(--cyan)] hover:bg-[var(--accent)] transition-colors"
              >
                <BookOpen size={10} /> 引用笔记
              </Link>
            </div>
          </>
        )}
      </div>

      {/* ===== Center: Chat Panel ===== */}
      <div className="flex-1 min-w-0 flex flex-col">
        <ChatPanel
          novelId={novelId}
          chapterId={selectedId}
          chapterBody={selectedChapter?.body || ""}
          onBodyChange={handleBodyChange}
          onSave={handleSave}
          onPipelineResult={handlePipelineResult}
        />
      </div>

      {/* ===== Right: Content + Tools ===== */}
      <div
        className={`shrink-0 border-l border-card-border flex flex-col overflow-hidden transition-all duration-200 ${
          viewerOpen ? "w-[30rem]" : "w-10"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2.5 py-2 border-b border-card-border shrink-0">
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
              <span className="text-[11px] font-medium text-muted-foreground">
                {selectedChapter ? selectedChapter.title : "章节内容"}
              </span>
              <div className="flex items-center gap-1">
                {/* 快捷键提示 */}
                <span className="text-[9px] text-muted-foreground/40 mr-1">
                  Ctrl+S 保存
                </span>
                <button
                  onClick={handleRefreshChapter}
                  disabled={refreshing}
                  className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  title="刷新章节内容"
                >
                  <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={() => setViewerOpen(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                >
                  <PanelRightClose size={14} />
                </button>
              </div>
            </>
          )}
        </div>

        {viewerOpen && selectedChapter && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Content area */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {editingBody ? (
                <div className="relative">
                  {/* 编辑模式视觉标识 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-medium text-[var(--cyan)] px-2 py-0.5 rounded-full bg-[var(--cyan)]/10">
                      编辑中
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {editedBody.replace(/\s/g, "").length} 字
                    </span>
                  </div>
                  <textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    className="w-full h-full min-h-[300px] bg-[var(--accent)]/30 text-sm leading-[1.8] resize-none focus:outline-none rounded-lg p-4 border border-[var(--cyan)]/30 focus:border-[var(--cyan)] transition-colors"
                    placeholder="编辑正文…"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="relative group">
                  <div
                    className="text-sm leading-[1.8] whitespace-pre-wrap cursor-text rounded-lg p-4 transition-colors min-h-[200px] hover:bg-[var(--accent)]/20 chapter-body"
                    onClick={handleStartEdit}
                    onMouseUp={() => {
                      // 延迟检测，避免快速选择时多次触发
                      setTimeout(() => {
                        const selection = window.getSelection();
                        const text = selection?.toString().trim();
                        if (text && text.length > 5 && text.length < 2000) {
                          const range = selection?.getRangeAt(0);
                          const rect = range?.getBoundingClientRect();
                          if (rect) {
                            setInlineAI({
                              selectedText: text,
                              position: { x: rect.left + rect.width / 2 - 160, y: rect.bottom + 8 },
                            });
                          }
                        }
                      }, 10);
                    }}
                  >
                    {selectedChapter.body || (
                      <span className="text-muted-foreground/50 italic">
                        空章节。点击此处编辑，或在左侧对话框中让 AI 写作。
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-card-border shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {selectedChapter.wordCount} 字
                </span>
                {editingBody && (
                  <span className="text-[10px] text-muted-foreground">
                    Esc 取消
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editingBody ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="px-2.5 py-1 rounded text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="flex items-center gap-1 px-3 py-1 rounded text-[11px] font-medium bg-[var(--cyan)] text-[#0a0e17] hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                      保存
                    </button>
                  </>
                ) : (
                  <>
                    {saved ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400/70">
                        <Check size={10} /> 已保存
                      </span>
                    ) : (
                      <button
                        onClick={handleSaveClick}
                        className="flex items-center gap-1 px-3 py-1 rounded text-[11px] font-medium bg-[var(--cyan)] text-[#0a0e17] hover:opacity-90 transition-all"
                      >
                        <Save size={11} /> 保存
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {viewerOpen && !selectedChapter && (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div>
              <BookOpen size={28} className="text-muted-foreground/30 mb-3 mx-auto" />
              <p className="text-[12px] text-muted-foreground">选择一个章节查看</p>
            </div>
          </div>
        )}

        {/* ===== Tools Panel (Audit / Truth / Intent) ===== */}
        {viewerOpen && selectedChapter && (
          <div className={`border-t border-card-border shrink-0 flex flex-col ${panelExpanded ? "flex-1" : ""}`}>
            {/* Tab bar */}
            <div className="flex border-b border-card-border shrink-0">
              {[
                { id: "audit" as const, icon: <Shield size={10} />, label: "AI味审计" },
                { id: "truth" as const, icon: <Database size={10} />, label: "真相文件" },
                { id: "intent" as const, icon: <Target size={10} />, label: "章节意图" },
                { id: "agents" as const, icon: <Users size={10} />, label: "角色Agent" },
                { id: "curve" as const, icon: <TrendingUp size={10} />, label: "情感曲线" },
                { id: "editorial" as const, icon: <Users size={10} />, label: "编辑部" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRightPanel(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-[10px] font-medium transition-colors ${
                    rightPanel === tab.id
                      ? "text-[var(--cyan)] border-b-2 border-[var(--cyan)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
              <button
                onClick={() => setPanelExpanded(!panelExpanded)}
                className="px-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
                title={panelExpanded ? "收起面板" : "展开面板"}
              >
                <ChevronDown size={10} className={`transition-transform ${panelExpanded ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Panel content */}
            <div
              key={rightPanel}
              className={`overflow-y-auto p-3 ${panelExpanded ? "flex-1" : "max-h-[350px]"}`}
              ref={(el) => {
                if (el) slideUp(el, { duration: 250 });
              }}
            >
              {rightPanel === "audit" && (
                <AuditPanel
                  novelId={novelId}
                  chapterId={selectedChapter.id}
                  onRewrite={(issues) => {
                    toast.success("正在修复AI味问题…");
                  }}
                />
              )}
              {rightPanel === "truth" && (
                <TruthFilesPanel
                  novelId={novelId}
                  refreshTrigger={refreshTruthFiles}
                />
              )}
              {rightPanel === "intent" && (
                <ChapterIntentPanel intent={chapterIntent} />
              )}
              {rightPanel === "agents" && (
                <CharacterAgentPanel novelId={novelId} />
              )}
              {rightPanel === "curve" && (
                <EmotionalCurvePanel novelId={novelId} />
              )}
              {rightPanel === "editorial" && (
                <EditorialBoardPanel novelId={novelId} chapterId={selectedId} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 内联 AI 工具栏 */}
      {inlineAI && selectedId && (
        <InlineAIToolbar
          selectedText={inlineAI.selectedText}
          position={inlineAI.position}
          novelId={novelId}
          chapterId={selectedId}
          onApply={(newText) => {
            // 替换正文中的选中文字
            if (selectedChapter) {
              const newBody = selectedChapter.body.replace(
                inlineAI.selectedText,
                newText
              );
              handleBodyChange(newBody);
              handleSave(newBody);
              toast.success("已应用修改");
            }
          }}
          onCancel={() => setInlineAI(null)}
        />
      )}
    </div>
  );
}
