"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wand2, Clapperboard, Download, Loader2, Play, Film, Plus, Trash2, GripVertical, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { updateClip, reorderClips, deleteClip } from "./actions";

interface ClipData {
  id: string;
  order: number;
  scriptText: string;
  visualPrompt: string;
  duration: number;
  clipUrl?: string | null;
  voiceUrl?: string | null;
  status: string;
  error?: string | null;
}

interface ProjectData {
  id: string;
  title: string;
  topic: string;
  platform: string;
  style: string | null;
  script: string | null;
  status: string;
  bgmPath: string | null;
  outputUrl: string | null;
  clips: ClipData[];
}

export default function StudioShell({ project: initialProject }: { project: ProjectData }) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [clips, setClips] = useState(initialProject.clips);
  const [selectedId, setSelectedId] = useState<string | null>(clips[0]?.id || null);
  const [generating, setGenerating] = useState(false);
  const [assembling, setAssembling] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const selectedClip = clips.find((c) => c.id === selectedId) || null;

  const handleReorder = useCallback(async (from: number, to: number) => {
    const reordered = [...clips];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const updated = reordered.map((c, i) => ({ ...c, order: i }));
    setClips(updated);
    await reorderClips(updated.map((c) => ({ id: c.id, order: c.order })));
  }, [clips]);

  const handleUpdateClip = useCallback(async (id: string, data: Partial<ClipData>) => {
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    await updateClip(id, data);
  }, []);

  const handleDeleteClip = useCallback(async (id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
    await deleteClip(id);
    if (selectedId === id) setSelectedId(clips.find((c) => c.id !== id)?.id || null);
  }, [selectedId, clips]);

  const handleGenerateMedia = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/photon/generate-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成失败");
      if (data.results) {
        const errors: string[] = [];
        setClips((prev) => prev.map((c) => {
          const r = data.results.find((x: { clipId: string; error?: string; videoUrl?: string; voiceUrl?: string }) => x.clipId === c.id);
          if (r && !r.error) return { ...c, status: "done" as const, clipUrl: r.videoUrl || c.clipUrl, voiceUrl: r.voiceUrl || c.voiceUrl, error: null };
          if (r && r.error) { errors.push(`#${c.order + 1}: ${r.error}`); return { ...c, status: "failed" as const, error: r.error }; }
          return c;
        }));
        if (errors.length > 0) setError(errors.join("\n"));
      }
      router.refresh();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "未知错误"); }
    finally { setGenerating(false); }
  };

  const handleAssemble = async () => {
    setAssembling(true);
    setError(null);
    try {
      const res = await fetch("/api/photon/assemble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "合成失败");
      setProject((prev) => ({ ...prev, outputUrl: data.outputUrl, status: "done" }));
      router.refresh();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "未知错误"); }
    finally { setAssembling(false); }
  };

  const handleExportJianying = async () => {
    setExporting(true);
    setError(null);
    setExportResult(null);
    try {
      const res = await fetch("/api/photon/export-jianying", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "导出失败");
      setExportResult(data.message);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "未知错误"); }
    finally { setExporting(false); }
  };

  const statusColors: Record<string, string> = {
    done: "bg-emerald-400", generating: "bg-amber-400 animate-pulse",
    failed: "bg-red-400", pending: "bg-muted-foreground/30",
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-card-border shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/workspace/photon" className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-mono text-base font-bold">{project.title}</h1>
            <p className="text-[10px] text-muted-foreground">{project.topic}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleExportJianying} disabled={exporting}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-card-border text-muted-foreground hover:text-foreground hover:border-[var(--cyan)] transition-all disabled:opacity-50">
            {exporting ? <Loader2 size={12} className="animate-spin" /> : <Film size={12} />}
            {exporting ? "导出中…" : "导出剪映"}
          </button>
          {project.outputUrl && (
            <a href={project.outputUrl} download
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--cyan)] text-[#0a0e17] hover:opacity-90 transition-all">
              <Download size={12} /> 下载
            </a>
          )}
        </div>
      </div>

      {/* Error/Success */}
      {error && (
        <div className="mx-4 mt-2 text-[11px] text-red-400 p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
          {error}
          {error.includes("API Key") && <Link href="/workspace/settings" className="ml-2 underline text-[var(--cyan)]">前往设置</Link>}
          {error.includes("DASHSCOPE_API_KEY") && (
            <span className="ml-2"><Link href="/workspace/settings" className="underline text-[var(--cyan)]">设置</Link>{" "}<a href="https://dashscope.console.aliyun.com" target="_blank" rel="noopener noreferrer" className="underline text-[var(--cyan)]">DashScope <ExternalLink size={9} className="inline" /></a></span>
          )}
        </div>
      )}
      {exportResult && <div className="mx-4 mt-2 text-[11px] text-emerald-400 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2"><Film size={12} />{exportResult}</div>}

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video Preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[var(--background)]">
          {project.outputUrl ? (
            <div className="max-w-xs rounded-xl overflow-hidden bg-black shadow-2xl">
              <video src={project.outputUrl} controls className="w-full" />
            </div>
          ) : selectedClip?.clipUrl ? (
            <div className="max-w-xs rounded-xl overflow-hidden bg-black shadow-2xl">
              <video src={selectedClip.clipUrl} controls className="w-full" />
            </div>
          ) : (
            <div className="text-center">
              <Play size={48} className="text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">生成素材后可在此预览</p>
            </div>
          )}
        </div>

        {/* Right: Clip List */}
        <div className="w-80 border-l border-card-border flex flex-col shrink-0">
          <div className="px-3 py-2 border-b border-card-border flex items-center justify-between shrink-0">
            <span className="text-[11px] font-medium text-muted-foreground">{clips.length} 个分镜</span>
            <span className="text-[10px] text-muted-foreground">
              {clips.filter((c) => c.status === "done").length}/{clips.length} 已生成
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {clips.map((clip, idx) => (
              <div
                key={clip.id}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => { e.preventDefault(); setOverIdx(idx); }}
                onDrop={() => { if (dragIdx !== null && dragIdx !== idx) handleReorder(dragIdx, idx); setDragIdx(null); setOverIdx(null); }}
                onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                onClick={() => setSelectedId(clip.id)}
                className={`flex items-start gap-2 px-3 py-2.5 cursor-pointer border-b border-card-border transition-all ${
                  selectedId === clip.id ? "bg-[var(--accent)]" : "hover:bg-[var(--accent)]/50"
                } ${dragIdx === idx ? "opacity-50" : ""} ${overIdx === idx && dragIdx !== idx ? "border-l-2 border-l-[var(--cyan)]" : ""}`}
              >
                <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                  <GripVertical size={10} className="text-muted-foreground/30 cursor-grab" />
                  <span className={`w-2 h-2 rounded-full ${statusColors[clip.status] || statusColors.pending}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] text-muted-foreground">#{idx + 1}</span>
                    <span className="text-[10px] text-muted-foreground">{clip.duration}s</span>
                  </div>
                  <p className="text-[11px] leading-relaxed line-clamp-2">{clip.scriptText}</p>
                  {clip.error && <p className="text-[10px] text-red-400 mt-0.5 truncate">{clip.error}</p>}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteClip(clip.id); }}
                  className="p-0.5 rounded text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>

          {/* Edit area for selected clip */}
          {selectedClip && (
            <div className="border-t border-card-border p-3 space-y-2 shrink-0">
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">旁白文案</label>
                <textarea
                  value={selectedClip.scriptText}
                  onChange={(e) => handleUpdateClip(selectedClip.id, { scriptText: e.target.value })}
                  rows={2}
                  className="w-full px-2 py-1.5 rounded-lg bg-[var(--accent)] border border-card-border text-[11px] focus:outline-none focus:border-[var(--cyan)] resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">画面描述</label>
                <textarea
                  value={selectedClip.visualPrompt}
                  onChange={(e) => handleUpdateClip(selectedClip.id, { visualPrompt: e.target.value })}
                  rows={2}
                  className="w-full px-2 py-1.5 rounded-lg bg-[var(--accent)] border border-card-border text-[11px] focus:outline-none focus:border-[var(--cyan)] resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground mb-0.5 block">时长</label>
                  <input
                    type="number"
                    value={selectedClip.duration}
                    onChange={(e) => handleUpdateClip(selectedClip.id, { duration: Number(e.target.value) })}
                    min={1} max={30}
                    className="w-full px-2 py-1 rounded-lg bg-[var(--accent)] border border-card-border text-[11px] focus:outline-none focus:border-[var(--cyan)]"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground mt-4">秒</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Action buttons */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-card-border shrink-0">
        <button type="button" onClick={handleGenerateMedia} disabled={generating}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[var(--nebula-soft)] text-[var(--nebula)] hover:bg-[var(--nebula)] hover:text-white transition-all disabled:opacity-50">
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
          {generating ? "生成中…" : "生成所有素材"}
        </button>
        <button type="button" onClick={handleAssemble} disabled={assembling || !clips.every((c) => c.status === "done")}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[var(--star)]/15 text-[var(--star)] hover:bg-[var(--star)] hover:text-[#0a0e17] transition-all disabled:opacity-50">
          {assembling ? <Loader2 size={14} className="animate-spin" /> : <Clapperboard size={14} />}
          {assembling ? "合成中…" : "合成视频"}
        </button>
      </div>
    </div>
  );
}
