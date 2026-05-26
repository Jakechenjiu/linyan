"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wand2, Clapperboard, Download, Loader2, Play, Film, Trash2, GripVertical, ExternalLink, Check } from "lucide-react";
import PipelineView from "@/components/photon/PipelineView";
import { WORKFLOW_TEMPLATES, Workflow, WorkflowNode, getCurrentNode, areInputsDone } from "@/lib/photon/workflows";
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
  const [selectedClipId, setSelectedClipId] = useState<string | null>(clips[0]?.id || null);
  const [error, setError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  // Initialize workflow from project state
  const [workflow, setWorkflow] = useState<Workflow>(() => {
    const template = WORKFLOW_TEMPLATES["douyin-short-video"];
    const nodes = template.nodes.map((node) => {
      // Auto-detect completed steps based on project state
      if (node.id === "input") return { ...node, status: "done" as const, config: { topic: initialProject.topic, style: initialProject.style || "混剪", platform: initialProject.platform } };
      if (node.id === "script" && initialProject.clips.length > 0) return { ...node, status: "done" as const };
      if (node.id === "review" && initialProject.clips.length > 0) return { ...node, status: "done" as const };
      if (node.id === "media" && initialProject.clips.every((c) => c.status === "done")) return { ...node, status: "done" as const };
      if (node.id === "assemble" && initialProject.outputUrl) return { ...node, status: "done" as const };
      if (node.id === "export" && initialProject.status === "done") return { ...node, status: "done" as const };
      return node;
    });
    return { ...template, nodes, currentNodeId: nodes.find((n) => n.status === "pending")?.id || null };
  });

  const [activeNodeId, setActiveNodeId] = useState<string>(workflow.currentNodeId || "input");
  const activeNode = workflow.nodes.find((n) => n.id === activeNodeId) || null;
  const selectedClip = clips.find((c) => c.id === selectedClipId) || null;

  // Update node status
  const updateNodeStatus = useCallback((nodeId: string, status: WorkflowNode["status"], result?: string, error?: string) => {
    setWorkflow((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => n.id === nodeId ? { ...n, status, result, error } : n),
      currentNodeId: status === "done" ? prev.nodes.find((n) => n.status === "pending")?.id || null : prev.currentNodeId,
    }));
  }, []);

  // Node execution handlers
  const handleGenerateScript = async () => {
    updateNodeStatus("script", "running");
    try {
      const res = await fetch("/api/photon/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: project.topic, style: project.style || "混剪", platform: project.platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成失败");
      // Reload project data
      router.refresh();
      updateNodeStatus("script", "done");
      updateNodeStatus("review", "done"); // Auto-approve for now
    } catch (e: unknown) {
      updateNodeStatus("script", "error", undefined, e instanceof Error ? e.message : "未知错误");
      setError(e instanceof Error ? e.message : "未知错误");
    }
  };

  const handleGenerateMedia = async () => {
    updateNodeStatus("media", "running");
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
        if (errors.length > 0) {
          setError(errors.join("\n"));
          updateNodeStatus("media", "error", undefined, errors.join("\n"));
        } else {
          updateNodeStatus("media", "done");
        }
      }
      router.refresh();
    } catch (e: unknown) {
      updateNodeStatus("media", "error", undefined, e instanceof Error ? e.message : "未知错误");
      setError(e instanceof Error ? e.message : "未知错误");
    }
  };

  const handleAssemble = async () => {
    updateNodeStatus("assemble", "running");
    try {
      const res = await fetch("/api/photon/assemble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "合成失败");
      setProject((prev) => ({ ...prev, outputUrl: data.outputUrl, status: "done" }));
      updateNodeStatus("assemble", "done");
      router.refresh();
    } catch (e: unknown) {
      updateNodeStatus("assemble", "error", undefined, e instanceof Error ? e.message : "未知错误");
      setError(e instanceof Error ? e.message : "未知错误");
    }
  };

  const handleExportJianying = async () => {
    updateNodeStatus("export", "running");
    try {
      const res = await fetch("/api/photon/export-jianying", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "导出失败");
      setExportResult(data.message);
      updateNodeStatus("export", "done");
    } catch (e: unknown) {
      updateNodeStatus("export", "error", undefined, e instanceof Error ? e.message : "未知错误");
      setError(e instanceof Error ? e.message : "未知错误");
    }
  };

  const handleUpdateClip = useCallback(async (id: string, data: Partial<ClipData>) => {
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    await updateClip(id, data);
  }, []);

  const handleReorder = useCallback(async (from: number, to: number) => {
    const reordered = [...clips];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const updated = reordered.map((c, i) => ({ ...c, order: i }));
    setClips(updated);
    await reorderClips(updated.map((c) => ({ id: c.id, order: c.order })));
  }, [clips]);

  const handleDeleteClip = useCallback(async (id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
    await deleteClip(id);
    if (selectedClipId === id) setSelectedClipId(clips.find((c) => c.id !== id)?.id || null);
  }, [selectedClipId, clips]);

  const statusColors: Record<string, string> = {
    done: "bg-emerald-400", generating: "bg-amber-400 animate-pulse",
    failed: "bg-red-400", pending: "bg-muted-foreground/30",
  };

  // Render content based on active node
  const renderNodeContent = () => {
    if (!activeNode) return null;

    switch (activeNode.id) {
      case "input":
        return (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--cyan)]/10 flex items-center justify-center mx-auto">
                <Wand2 size={28} className="text-[var(--cyan)]" />
              </div>
              <h3 className="font-mono text-lg font-bold">准备就绪</h3>
              <p className="text-sm text-muted-foreground">主题: {project.topic}</p>
              <p className="text-sm text-muted-foreground">风格: {project.style || "混剪"} · 平台: {project.platform}</p>
              <button onClick={() => { setActiveNodeId("script"); handleGenerateScript(); }}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[var(--cyan)] text-[#0a0e17] hover:opacity-90 transition-all">
                开始生成脚本
              </button>
            </div>
          </div>
        );

      case "script":
      case "review":
        return (
          <div className="flex-1 flex overflow-hidden">
            {/* Clip list */}
            <div className="flex-1 overflow-y-auto">
              {clips.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  {activeNode.status === "running" ? "正在生成脚本…" : "等待脚本生成"}
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {clips.map((clip, idx) => (
                    <div key={clip.id} onClick={() => setSelectedClipId(clip.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        selectedClipId === clip.id ? "bg-[var(--accent)] border border-[var(--cyan)]" : "border border-card-border hover:bg-[var(--accent)]"
                      }`}>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <GripVertical size={10} className="text-muted-foreground/30" />
                        <span className="text-[10px] text-muted-foreground">#{idx + 1}</span>
                        <span className="text-[10px] text-muted-foreground">{clip.duration}s</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-relaxed">{clip.scriptText}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">画面: {clip.visualPrompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Edit panel */}
            {selectedClip && (
              <div className="w-72 border-l border-card-border p-4 space-y-3 overflow-y-auto shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">编辑分镜 #{selectedClip.order + 1}</span>
                  <button onClick={() => handleDeleteClip(selectedClip.id)} className="text-muted-foreground hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-0.5 block">旁白文案</label>
                  <textarea value={selectedClip.scriptText} onChange={(e) => handleUpdateClip(selectedClip.id, { scriptText: e.target.value })}
                    rows={3} className="w-full px-2 py-1.5 rounded-lg bg-[var(--accent)] border border-card-border text-[11px] focus:outline-none focus:border-[var(--cyan)] resize-none" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-0.5 block">画面描述</label>
                  <textarea value={selectedClip.visualPrompt} onChange={(e) => handleUpdateClip(selectedClip.id, { visualPrompt: e.target.value })}
                    rows={3} className="w-full px-2 py-1.5 rounded-lg bg-[var(--accent)] border border-card-border text-[11px] focus:outline-none focus:border-[var(--cyan)] resize-none" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-0.5 block">时长 (秒)</label>
                  <input type="number" value={selectedClip.duration} onChange={(e) => handleUpdateClip(selectedClip.id, { duration: Number(e.target.value) })}
                    min={1} max={30} className="w-full px-2 py-1 rounded-lg bg-[var(--accent)] border border-card-border text-[11px] focus:outline-none focus:border-[var(--cyan)]" />
                </div>
                {activeNode.id === "review" && (
                  <button onClick={() => updateNodeStatus("review", "done")}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                    <Check size={14} /> 确认脚本
                  </button>
                )}
              </div>
            )}
          </div>
        );

      case "media":
        return (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-center p-6">
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
                  <p className="text-sm text-muted-foreground">
                    {activeNode.status === "running" ? "正在生成素材…" : "点击「生成素材」开始"}
                  </p>
                </div>
              )}
            </div>
            <div className="w-72 border-l border-card-border overflow-y-auto">
              {clips.map((clip, idx) => (
                <div key={clip.id} onClick={() => setSelectedClipId(clip.id)}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-card-border ${
                    selectedClipId === clip.id ? "bg-[var(--accent)]" : "hover:bg-[var(--accent)]/50"
                  }`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${statusColors[clip.status] || statusColors.pending}`} />
                  <span className="text-[10px] text-muted-foreground shrink-0">#{idx + 1}</span>
                  <p className="text-[11px] truncate flex-1">{clip.scriptText}</p>
                  {clip.status === "done" && <Check size={10} className="text-emerald-400 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        );

      case "assemble":
        return (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md text-center space-y-4">
              {project.outputUrl ? (
                <>
                  <div className="max-w-xs rounded-xl overflow-hidden bg-black shadow-2xl mx-auto">
                    <video src={project.outputUrl} controls className="w-full" />
                  </div>
                  <p className="text-sm text-emerald-400">视频合成完成</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-[var(--star)]/10 flex items-center justify-center mx-auto">
                    <Clapperboard size={28} className="text-[var(--star)]" />
                  </div>
                  <h3 className="font-mono text-lg font-bold">准备合成</h3>
                  <p className="text-sm text-muted-foreground">
                    {clips.filter((c) => c.status === "done").length}/{clips.length} 个分镜已就绪
                  </p>
                  <button onClick={handleAssemble} disabled={!clips.every((c) => c.status === "done")}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[var(--star)]/15 text-[var(--star)] hover:bg-[var(--star)] hover:text-[#0a0e17] transition-all disabled:opacity-50">
                    合成视频
                  </button>
                </>
              )}
            </div>
          </div>
        );

      case "export":
        return (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 flex items-center justify-center mx-auto">
                <Download size={28} className="text-emerald-400" />
              </div>
              <h3 className="font-mono text-lg font-bold">导出</h3>
              <div className="flex items-center justify-center gap-3">
                {project.outputUrl && (
                  <a href={project.outputUrl} download
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--cyan)] text-[#0a0e17] hover:opacity-90 transition-all">
                    <Download size={14} /> 下载视频
                  </a>
                )}
                <button onClick={handleExportJianying}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold border border-card-border text-muted-foreground hover:text-foreground hover:border-[var(--cyan)] transition-all">
                  <Film size={14} /> 导出剪映
                </button>
              </div>
              {exportResult && <p className="text-sm text-emerald-400">{exportResult}</p>}
            </div>
          </div>
        );

      default:
        return null;
    }
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
      </div>

      {/* Pipeline */}
      <div className="border-b border-card-border shrink-0">
        <PipelineView nodes={workflow.nodes} activeNodeId={activeNodeId} onNodeClick={setActiveNodeId} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-2 text-[11px] text-red-400 p-2.5 rounded-lg bg-red-500/5 border border-red-500/20 flex items-center justify-between shrink-0">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
      )}

      {/* Main content */}
      {renderNodeContent()}

      {/* Bottom actions based on active node */}
      {activeNode && (
        <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-card-border shrink-0">
          {activeNode.id === "review" && clips.length > 0 && (
            <button onClick={() => { updateNodeStatus("review", "done"); setActiveNodeId("media"); }}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[var(--nebula-soft)] text-[var(--nebula)] hover:bg-[var(--nebula)] hover:text-white transition-all">
              确认并生成素材 →
            </button>
          )}
          {activeNode.id === "media" && (
            <button onClick={handleGenerateMedia} disabled={activeNode.status === "running"}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[var(--nebula-soft)] text-[var(--nebula)] hover:bg-[var(--nebula)] hover:text-white transition-all disabled:opacity-50">
              {activeNode.status === "running" ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              {activeNode.status === "running" ? "生成中…" : "生成所有素材"}
            </button>
          )}
          {activeNode.id === "assemble" && project.outputUrl && (
            <button onClick={() => { updateNodeStatus("assemble", "done"); setActiveNodeId("export"); }}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
              继续导出 →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
