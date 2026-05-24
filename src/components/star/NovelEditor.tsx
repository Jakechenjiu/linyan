"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Save, Sparkles, Loader2, Eye } from "lucide-react";
import { saveChapter } from "./actions";

interface ReviewResult {
  overall: string;
  summary: string;
  issues: { severity: string; category: string; location: string; description: string; fixHint: string }[];
  strengths: string[];
}

const severityColors: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#f0e68c",
  low: "#6b7280",
};

const categoryLabels: Record<string, string> = {
  character_consistency: "角色一致性",
  setting_consistency: "设定一致性",
  narrative_coherence: "叙事连贯性",
  pacing: "节奏",
  ai_flavor: "AI味检测",
};

interface Props {
  novelId: string;
  chapter: {
    id: string;
    title: string;
    body: string;
    wordCount: number;
    order: number;
  };
}

export default function NovelEditor({ novelId, chapter }: Props) {
  const [title, setTitle] = useState(chapter.title);
  const [body, setBody] = useState(chapter.body);
  const [saving, setSaving] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = async () => {
    setSaving(true);
    await saveChapter(chapter.id, title, body);
    setSaving(false);
  };

  const handleAiGenerate = async () => {
    setStreaming(true);
    setError(null);
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch(`/api/novels/${novelId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: chapter.id, direction: direction || undefined }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "生成失败");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let newBody = body;
      let appendText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        appendText += chunk;
        setBody(newBody + appendText);
        // Auto-scroll textarea
        if (textareaRef.current) {
          textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
      }

      // Auto-save after generation
      await saveChapter(chapter.id, title, newBody + appendText);
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setError(e.message || "生成失败");
      }
    } finally {
      setStreaming(false);
      controllerRef.current = null;
    }
  };

  const handleStop = () => {
    controllerRef.current?.abort();
    setStreaming(false);
  };

  const handleReview = async () => {
    setReviewing(true);
    setReview(null);
    try {
      const res = await fetch(`/api/novels/${novelId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: chapter.id }),
      });
      if (!res.ok) throw new Error("审查失败");
      const data = await res.json();
      setReview(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setReviewing(false);
    }
  };

  const wordCount = body.trim().length;

  return (
    <div className="space-card rounded-2xl p-6">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full font-mono text-xl font-bold bg-transparent border-b border-card-border pb-2 mb-4 focus:outline-none focus:border-[var(--cyan)] transition-colors"
      />

      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={Math.max(8, body.split("\n").length + 4)}
        className="w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none"
        placeholder="开始写作…"
      />

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-card-border">
        <span className="text-xs text-muted-foreground">{wordCount.toLocaleString()} 字</span>
        <div className="flex items-center gap-2">
          <input
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            placeholder="续写方向（可选）…"
            className="w-36 px-2 py-1 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-[10px] placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors"
          />
          {streaming ? (
            <button type="button" onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
              <Loader2 size={12} className="animate-spin" /> 停止
            </button>
          ) : (
            <button type="button" onClick={handleAiGenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-card-border hover:border-[var(--nebula)] text-[var(--nebula)] transition-colors">
              <Sparkles size={12} /> AI 续写
            </button>
          )}
          <button type="button" onClick={handleReview} disabled={reviewing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-card-border hover:border-[var(--star)] text-[var(--star)] transition-colors disabled:opacity-50">
            {reviewing ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
            {reviewing ? "审查中…" : "审查"}
          </button>
          <button type="button" onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--cyan-soft)] text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-[#0a0e17] transition-all">
            <Save size={12} /> {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
      {error && (
        <div className="text-[10px] text-red-400 mt-2">
          {error}
          {error.includes("API Key") && (
            <Link href="/workspace/settings" className="ml-2 underline text-[var(--cyan)]">前往设置</Link>
          )}
        </div>
      )}

      {/* Review results */}
      {review && (
        <div className="mt-4 p-4 rounded-xl bg-[var(--accent)] border border-card-border space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: severityColors[review.overall === "pass" ? "low" : review.overall === "fail" ? "critical" : "high"] }}>
              {review.overall === "pass" ? "通过" : review.overall === "fail" ? "不通过" : "需改进"}
            </span>
            <span className="text-xs text-muted-foreground">{review.summary}</span>
          </div>

          {review.issues.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-foreground">发现问题 ({review.issues.length})：</p>
              {review.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--background)]">
                  <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full" style={{ background: severityColors[issue.severity] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${severityColors[issue.severity]}15`, color: severityColors[issue.severity] }}>
                        {issue.severity}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{categoryLabels[issue.category] || issue.category}</span>
                      <span className="text-[10px] text-muted-foreground">— {issue.location}</span>
                    </div>
                    <p className="text-xs">{issue.description}</p>
                    {issue.fixHint && <p className="text-[11px] text-[var(--cyan)] mt-0.5">→ {issue.fixHint}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {review.strengths.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-foreground mb-1">亮点：</p>
              {review.strengths.map((s, i) => (
                <p key={i} className="text-xs text-[var(--star)]">+ {s}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
