"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Sparkles, Loader2, X } from "lucide-react";
import { saveContent } from "./actions";

interface Props {
  content: {
    id: string;
    title: string;
    body: string;
    platform: string;
    wordCount: number;
    status: string;
  };
}

export default function ContentEditor({ content }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(content.title);
  const [body, setBody] = useState(content.body);
  const [status, setStatus] = useState(content.status);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [variants, setVariants] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    const formData = new FormData();
    formData.set("contentId", content.id);
    formData.set("title", title);
    formData.set("body", body);
    formData.set("status", status);
    await saveContent(formData);
    setSaving(false);
    router.refresh();
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    setError(null);
    setVariants(null);
    try {
      const res = await fetch("/api/photon/optimize-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, platform: content.platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "优化失败");
      setVariants(data.variants);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setOptimizing(false);
    }
  };

  const handleSelect = (v: string) => {
    setTitle(v);
    setVariants(null);
  };

  const wordCount = body.trim().length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link
          href="/workspace/photon"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors"
        >
          <ArrowLeft size={14} /> 返回光子面板
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{content.platform}</span>
          <span>·</span>
          <span>{wordCount.toLocaleString()} 字</span>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-400 p-3 rounded-xl bg-red-500/5 border border-red-500/20">{error}</div>
      )}

      {/* Title optimization variants */}
      {variants && (
        <div className="space-card rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">AI 推荐标题 (点击替换)</p>
            <button
              type="button"
              onClick={() => setVariants(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          {variants.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(v)}
              className="w-full text-left px-3 py-2 rounded-lg bg-[var(--background)] border border-card-border hover:border-[var(--cyan)] text-sm transition-colors"
            >
              <span className="text-[10px] text-muted-foreground mr-2">#{i + 1}</span>
              {v}
            </button>
          ))}
        </div>
      )}

      <div className="space-card rounded-2xl p-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full font-mono text-2xl font-bold bg-transparent border-b border-card-border pb-3 mb-5 focus:outline-none focus:border-[var(--cyan)] transition-colors"
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={Math.max(16, body.split("\n").length + 6)}
          className="w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none"
          placeholder="内容正文…"
        />

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-card-border">
          <div className="flex items-center gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-card-border text-xs focus:outline-none"
            >
              <option value="draft">草稿</option>
              <option value="published">公开发布</option>
            </select>
            <button
              type="button"
              onClick={handleOptimize}
              disabled={optimizing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-card-border hover:border-[var(--nebula)] text-[var(--nebula)] transition-colors disabled:opacity-50"
            >
              {optimizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {optimizing ? "优化中…" : "AI 优化标题"}
            </button>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50"
            style={{ color: "#0a0e17" }}
          >
            <Save size={14} /> {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
