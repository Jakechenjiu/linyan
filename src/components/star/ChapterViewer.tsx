"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Zap, AlertTriangle, Sparkles, Users, BookOpen, ListTree, Palette, Save, Check, Loader2 } from "lucide-react";

interface Chapter {
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

type TabId = "content" | "outline" | "characters";

export default function ChapterViewer({
  chapter,
  characters,
  outlineVolumes,
  onBodyChange,
  onSave,
}: {
  chapter: Chapter | null;
  characters: Character[];
  outlineVolumes: OutlineVolume[];
  onBodyChange?: (body: string) => void;
  onSave?: () => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("content");
  const [showFacts, setShowFacts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);

  const factData = chapter?.factSnapshot
    ? (JSON.parse(chapter.factSnapshot) as {
        newFacts?: string[];
        stateChanges?: string[];
        openHooks?: string[];
        characterMoments?: Record<string, string>;
      })
    : null;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "content", label: "正文", icon: <FileText size={12} /> },
    { id: "outline", label: "大纲", icon: <ListTree size={12} /> },
    { id: "characters", label: "角色", icon: <Palette size={12} /> },
  ];

  const handleBodyChange = (newBody: string) => {
    if (onBodyChange) {
      onBodyChange(newBody);
      setSaved(false);
    }
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    await onSave();
    setSaving(false);
    setSaved(true);
  };

  if (!chapter) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <BookOpen size={32} className="text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">选择一个章节查看</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-card-border shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              activeTab === tab.id
                ? "bg-[var(--accent)] text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground">{chapter.wordCount} 字</span>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "content" && (
          <div>
            <h3 className="font-mono text-sm font-bold mb-3">{chapter.title}</h3>
            {chapter.outline?.summary && (
              <div className="mb-3 p-2 rounded-lg bg-[var(--accent)] border border-card-border">
                <p className="text-[10px] text-muted-foreground mb-0.5">大纲摘要</p>
                <p className="text-xs">{chapter.outline.summary}</p>
              </div>
            )}
            {/* Editable textarea */}
            <textarea
              value={chapter.body}
              onChange={(e) => handleBodyChange(e.target.value)}
              rows={Math.max(15, chapter.body.split("\n").length + 4)}
              className="w-full bg-[var(--accent)]/20 text-sm leading-relaxed resize-none rounded-lg p-4 border border-card-border focus:outline-none focus:border-[var(--cyan)] focus:bg-[var(--accent)]/40 transition-all cursor-text"
              placeholder="点击这里开始写作…"
              spellCheck={false}
            />

            {/* Fact Snapshot */}
            {factData && (
              <div className="mt-4 rounded-xl border border-card-border overflow-hidden">
                <button
                  onClick={() => setShowFacts(!showFacts)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground bg-[var(--accent)] transition-colors"
                >
                  {showFacts ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <FileText size={11} /> 章节事实
                </button>
                {showFacts && (
                  <div className="p-3 space-y-2 text-[11px]">
                    {factData.newFacts && factData.newFacts.length > 0 && (
                      <div>
                        <p className="flex items-center gap-1 font-medium text-[var(--cyan)] mb-0.5"><Zap size={10} /> 新事实</p>
                        <ul className="space-y-0.5 ml-4">
                          {factData.newFacts.map((f, i) => <li key={i} className="text-muted-foreground">• {f}</li>)}
                        </ul>
                      </div>
                    )}
                    {factData.stateChanges && factData.stateChanges.length > 0 && (
                      <div>
                        <p className="flex items-center gap-1 font-medium text-[var(--star)] mb-0.5"><AlertTriangle size={10} /> 状态变化</p>
                        <ul className="space-y-0.5 ml-4">
                          {factData.stateChanges.map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}
                        </ul>
                      </div>
                    )}
                    {factData.openHooks && factData.openHooks.length > 0 && (
                      <div>
                        <p className="flex items-center gap-1 font-medium text-[var(--nebula)] mb-0.5"><Sparkles size={10} /> 未解伏笔</p>
                        <ul className="space-y-0.5 ml-4">
                          {factData.openHooks.map((h, i) => <li key={i} className="text-muted-foreground">• {h}</li>)}
                        </ul>
                      </div>
                    )}
                    {factData.characterMoments && Object.keys(factData.characterMoments).length > 0 && (
                      <div>
                        <p className="flex items-center gap-1 font-medium text-pink-400 mb-0.5"><Users size={10} /> 角色时刻</p>
                        <ul className="space-y-0.5 ml-4">
                          {Object.entries(factData.characterMoments).map(([name, moment]) => (
                            <li key={name} className="text-muted-foreground"><span className="text-foreground font-medium">{name}：</span>{moment}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "outline" && (
          <div className="space-y-3">
            {outlineVolumes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">暂无大纲</p>
            ) : (
              outlineVolumes.map((vol) => (
                <div key={vol.id} className="space-card rounded-lg p-3">
                  <p className="text-xs font-bold text-[var(--cyan)] mb-1">{vol.title}</p>
                  {vol.summary && <p className="text-[11px] text-muted-foreground mb-2">{vol.summary}</p>}
                  {vol.children.length > 0 && (
                    <div className="ml-2 space-y-0.5 border-l border-card-border pl-2">
                      {vol.children.map((ch) => (
                        <div key={ch.id} className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${ch.chapterId ? "bg-emerald-400" : "bg-muted-foreground/30"}`} />
                          <span className="text-[11px] text-muted-foreground truncate">{ch.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "characters" && (
          <div className="space-y-2">
            {characters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">暂无角色</p>
            ) : (
              characters.map((char) => {
                const roleColors: Record<string, string> = {
                  protagonist: "bg-cyan-500/20 text-cyan-400",
                  antagonist: "bg-red-500/20 text-red-400",
                  love_interest: "bg-pink-500/20 text-pink-400",
                  mentor: "bg-amber-500/20 text-amber-400",
                  supporting: "bg-purple-500/20 text-purple-400",
                };
                const roleLabels: Record<string, string> = {
                  protagonist: "主角",
                  antagonist: "反派",
                  love_interest: "感情线",
                  mentor: "导师",
                  supporting: "配角",
                };
                return (
                  <div key={char.id} className="space-card rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold">{char.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${roleColors[char.role] || roleColors.supporting}`}>
                        {roleLabels[char.role] || char.role}
                      </span>
                    </div>
                    {char.tagline && <p className="text-[10px] text-[var(--star)] mb-1">{char.tagline}</p>}
                    {char.personality && <p className="text-[11px] text-muted-foreground">{char.personality}</p>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Save bar - fixed at bottom */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-card-border shrink-0 bg-[var(--background)]">
        <span className="text-[10px] text-muted-foreground">{chapter.wordCount} 字</span>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Loader2 size={11} className="animate-spin" /> 保存中…
            </span>
          )}
          {!saving && saved && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <Check size={11} /> 已保存
            </span>
          )}
          <button type="button" onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--cyan-soft)] text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-[#0a0e17] transition-all">
            <Save size={11} /> 保存
          </button>
        </div>
      </div>
    </div>
  );
}
