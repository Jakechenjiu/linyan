"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Video, FileText, Zap, ArrowRight, RotateCcw } from "lucide-react";

const styles = [
  { id: "混剪", label: "混剪", desc: "画面多变，节奏快" },
  { id: "口播", label: "口播", desc: "主持人出镜讲解" },
  { id: "图文", label: "图文", desc: "文字+静态画面" },
];

const aspectRatios = [
  { id: "9:16", label: "9:16", desc: "竖屏" },
  { id: "16:9", label: "16:9", desc: "横屏" },
  { id: "1:1", label: "1:1", desc: "方形" },
];

export default function PhotonCreator() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("混剪");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [mode, setMode] = useState<"video" | "article">("video");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQuickCreate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");

    try {
      if (mode === "video") {
        // Create video project with auto-generated script
        const res = await fetch("/api/photon/quick-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topic.trim(),
            style,
            aspectRatio,
            platform: "douyin",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "创建失败");
        router.push(`/workspace/photon/studio/${data.projectId}`);
      } else {
        // Create article
        const res = await fetch("/api/photon/quick-create-article", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topic.trim(),
            platform: "wechat",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "创建失败");
        router.push(`/workspace/photon/editor/${data.contentId}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-card rounded-2xl p-6 space-y-5">
      {/* Mode selector */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setMode("video")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            mode === "video"
              ? "bg-[var(--nebula)] text-white"
              : "bg-[var(--accent)] text-muted-foreground hover:text-foreground"
          }`}
        >
          <Video size={14} /> AI 视频
        </button>
        <button
          onClick={() => setMode("article")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            mode === "article"
              ? "bg-[var(--nebula)] text-white"
              : "bg-[var(--accent)] text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText size={14} /> AI 文章
        </button>
      </div>

      {/* Topic input */}
      <div>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleQuickCreate();
            }
          }}
          rows={2}
          placeholder={mode === "video" ? "描述你要做的视频，例如：做一个关于AI写作技巧的60秒口播视频…" : "描述你要写的文章，例如：写一篇关于AI写作工具对比的深度文章…"}
          className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--nebula)] transition-colors resize-none"
        />
      </div>

      {/* Options */}
      <div className="flex items-center gap-4 flex-wrap">
        {mode === "video" && (
          <>
            {/* Style */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">风格</span>
              <div className="flex gap-1">
                {styles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                      style === s.id
                        ? "bg-[var(--nebula)] text-white"
                        : "bg-[var(--accent)] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect ratio */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">比例</span>
              <div className="flex gap-1">
                {aspectRatios.map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                      aspectRatio === ar.id
                        ? "bg-[var(--cyan)] text-[#0a0e17]"
                        : "bg-[var(--accent)] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={handleQuickCreate}
        disabled={loading || !topic.trim()}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-[var(--nebula)] hover:shadow-[0_0_24px_rgba(168,85,247,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        style={{ color: "#fff" }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            正在创建…
          </>
        ) : (
          <>
            <Sparkles size={16} />
            {mode === "video" ? "一键生成视频" : "一键生成文章"}
            <ArrowRight size={14} />
          </>
        )}
      </button>

      {error && (
        <div className="text-xs text-red-400 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          {error}
        </div>
      )}
    </div>
  );
}
