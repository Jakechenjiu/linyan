"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wand2, Clapperboard, Download, Loader2, Play, Film, ExternalLink } from "lucide-react";
import TimelineBar from "@/components/photon/TimelineBar";
import ScriptEditor from "@/components/photon/ScriptEditor";
import { updateClip, reorderClips, deleteClip, updateProject } from "./actions";

interface ClipData {
  id: string;
  order: number;
  scriptText: string;
  visualPrompt: string;
  duration: number;
  clipUrl?: string | null;
  voiceUrl?: string | null;
  status: string;
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

interface Props {
  project: ProjectData;
}

export default function StudioShell({ project: initialProject }: Props) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [clips, setClips] = useState(initialProject.clips);
  const [selectedId, setSelectedId] = useState<string | null>(clips[0]?.id || null);
  const [generating, setGenerating] = useState(false);
  const [assembling, setAssembling] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [providerType, setProviderType] = useState<"dashscope" | "pixelle">("dashscope");
  const [error, setError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<string | null>(null);

  const selectedClip = clips.find((c) => c.id === selectedId) || null;

  const handleReorder = useCallback(
    async (fromIndex: number, toIndex: number) => {
      const reordered = [...clips];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      const updated = reordered.map((c, i) => ({ ...c, order: i }));
      setClips(updated);
      await reorderClips(updated.map((c) => ({ id: c.id, order: c.order })));
    },
    [clips]
  );

  const handleEditClip = useCallback(
    async (id: string, field: string, value: string | number) => {
      setClips((prev) =>
        prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
      );
      await updateClip(id, { [field]: value });
    },
    []
  );

  const handleSaveEditor = useCallback(
    async (data: { scriptText: string; visualPrompt: string; duration: number }) => {
      if (!selectedId) return;
      setClips((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, ...data } : c))
      );
      await updateClip(selectedId, data);
    },
    [selectedId]
  );

  const handleDeleteClip = useCallback(
    async (id: string) => {
      setClips((prev) => prev.filter((c) => c.id !== id));
      await deleteClip(id);
      if (selectedId === id) {
        setSelectedId(clips.find((c) => c.id !== id)?.id || null);
      }
    },
    [selectedId, clips]
  );

  const handleGenerateMedia = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/photon/generate-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, provider: providerType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成失败");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleAssemble = async () => {
    setAssembling(true);
    setError(null);
    try {
      const res = await fetch("/api/photon/assemble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, resolution: "1080x1920" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "合成失败");
      setProject((prev) => ({ ...prev, outputUrl: data.outputUrl, status: "done" }));
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAssembling(false);
    }
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
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  };

  const canGenerate = clips.some((c) => c.status === "pending" || c.status === "failed");
  const canAssemble = clips.every((c) => c.status === "done" && c.clipUrl && c.voiceUrl);
  const hasOutput = !!project.outputUrl;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/workspace/photon"
            className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-mono text-2xl font-bold tracking-wide">{project.title}</h1>
            <p className="text-xs text-muted-foreground">{project.topic}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Provider selector */}
          {canGenerate && (
            <select
              value={providerType}
              onChange={(e) => setProviderType(e.target.value as "dashscope" | "pixelle")}
              className="px-2 py-1.5 rounded-lg bg-[var(--background)] border border-card-border text-[10px] focus:outline-none focus:border-[var(--cyan)]"
            >
              <option value="dashscope">通义万相</option>
              <option value="pixelle">Pixelle (本地)</option>
            </select>
          )}

          {canGenerate && (
            <button
              type="button"
              onClick={handleGenerateMedia}
              disabled={generating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--nebula-soft)] text-[var(--nebula)] hover:bg-[var(--nebula)] hover:text-white transition-all disabled:opacity-50"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              {generating ? "生成中…" : "生成素材"}
            </button>
          )}

          {canAssemble && (
            <button
              type="button"
              onClick={handleAssemble}
              disabled={assembling}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--star)]/15 text-[var(--star)] hover:bg-[var(--star)] hover:text-[#0a0e17] transition-all disabled:opacity-50"
            >
              {assembling ? <Loader2 size={14} className="animate-spin" /> : <Clapperboard size={14} />}
              {assembling ? "合成中…" : "合成视频"}
            </button>
          )}

          {/* Jianying export */}
          <button
            type="button"
            onClick={handleExportJianying}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-[var(--cyan)]/30 text-[var(--cyan)] hover:bg-[var(--cyan-soft)] transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Film size={14} />}
            {exporting ? "导出中…" : "导出剪映"}
          </button>

          {hasOutput && (
            <a
              href={project.outputUrl!}
              download
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--cyan)] text-[#0a0e17] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
            >
              <Download size={14} /> 下载
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-400 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
          {error}
          {error.includes("API Key") && (
            <Link href="/workspace/settings" className="ml-2 underline text-[var(--cyan)]">前往设置</Link>
          )}
          {error.includes("DASHSCOPE_API_KEY") && (
            <span className="ml-2">
              <Link href="/workspace/settings" className="underline text-[var(--cyan)]">前往设置</Link>
              {" "}或访问{" "}
              <a href="https://dashscope.console.aliyun.com" target="_blank" rel="noopener noreferrer" className="underline text-[var(--cyan)]">
                DashScope 控制台 <ExternalLink size={10} className="inline" />
              </a>
            </span>
          )}
        </div>
      )}

      {exportResult && (
        <div className="text-xs text-green-400 p-3 rounded-xl bg-green-500/5 border border-green-500/20 flex items-center gap-2">
          <Film size={14} />
          {exportResult}
        </div>
      )}

      {/* Platform & style tags */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--accent)] text-muted-foreground">
          {project.platform === "douyin" ? "抖音" : project.platform}
        </span>
        {project.style && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--accent)] text-muted-foreground">
            {project.style}
          </span>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--accent)] text-muted-foreground">
          {project.status === "draft" ? "草稿" : project.status === "generating" ? "生成中" : project.status === "ready" ? "待合成" : project.status === "done" ? "已完成" : project.status}
        </span>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TimelineBar
            clips={clips}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReorder={handleReorder}
            onEdit={handleEditClip}
          />
        </div>

        <div className="lg:col-span-1">
          {selectedClip ? (
            <ScriptEditor
              clip={selectedClip}
              onSave={handleSaveEditor}
              onDelete={clips.length > 1 ? () => handleDeleteClip(selectedClip.id) : undefined}
            />
          ) : (
            <div className="space-card rounded-2xl p-5 text-center text-xs text-muted-foreground">
              选择一个分镜进行编辑
            </div>
          )}
        </div>
      </div>

      {/* Preview player */}
      {hasOutput && (
        <div className="space-card rounded-2xl p-5">
          <h3 className="text-sm font-bold font-mono mb-3 flex items-center gap-2">
            <Play size={14} className="text-[var(--cyan)]" /> 预览
          </h3>
          <div className="max-w-sm mx-auto rounded-xl overflow-hidden bg-black">
            <video src={project.outputUrl!} controls className="w-full" poster="/photon-poster.png" />
          </div>
        </div>
      )}
    </div>
  );
}
