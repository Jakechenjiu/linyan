"use client";

import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";

interface OutlineInfo {
  id: string;
  title: string;
}

interface Props {
  novelId: string;
  outlines: OutlineInfo[];
}

export default function BatchGenerateButton({ novelId, outlines }: Props) {
  const [generating, setGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [results, setResults] = useState<{ title: string; ok: boolean; chapterId?: string; error?: string }[]>([]);

  const handleBatchGenerate = async () => {
    if (outlines.length === 0) return;
    setGenerating(true);
    setResults([]);
    setCurrentIndex(0);

    for (let i = 0; i < outlines.length; i++) {
      setCurrentIndex(i);
      setStatus(`正在生成第 ${i + 1}/${outlines.length} 章：${outlines[i].title}…`);

      try {
        const res = await fetch(`/api/novels/${novelId}/auto-generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outlineId: outlines[i].id }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "生成失败" }));
          setResults((prev) => [...prev, { title: outlines[i].title, ok: false, error: err.error }]);
          continue;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setResults((prev) => [...prev, { title: outlines[i].title, ok: false, error: "No stream" }]);
          continue;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let chapterId: string | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            try {
              const data = JSON.parse(raw);
              if (data.type === "done") chapterId = data.chapterId;
              if (data.type === "error") {
                setResults((prev) => [...prev, { title: outlines[i].title, ok: false, error: data.message }]);
              }
            } catch {}
          }
        }

        if (chapterId) {
          setResults((prev) => [...prev, { title: outlines[i].title, ok: true, chapterId }]);
        }
      } catch (e: any) {
        setResults((prev) => [...prev, { title: outlines[i].title, ok: false, error: e.message }]);
      }
    }

    setStatus(`全部完成！成功 ${results.filter((r) => r.ok).length + 1}/${outlines.length}`);
    setGenerating(false);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleBatchGenerate}
        disabled={generating || outlines.length === 0}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50"
        style={{ color: "#0a0e17" }}
      >
        {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {generating ? "批量生成中…" : `批量生成全部 (${outlines.length})`}
      </button>

      {generating && (
        <button
          type="button"
          onClick={() => setGenerating(false)}
          className="text-xs text-muted-foreground hover:text-red-400 flex items-center gap-1"
        >
          <X size={12} /> 停止
        </button>
      )}

      {status && (
        <span className={`text-xs ${status.startsWith("全部完成") ? "text-[var(--cyan)]" : "text-muted-foreground"}`}>
          {status}
        </span>
      )}

      {results.length > 0 && !generating && (
        <div className="flex flex-wrap gap-1">
          {results.map((r, i) => (
            <span
              key={i}
              className={`text-[10px] px-1.5 py-0.5 rounded ${r.ok ? "bg-[var(--cyan)]/10 text-[var(--cyan)]" : "bg-red-500/10 text-red-400"}`}
            >
              {r.ok ? "✓" : "✗"} {r.title}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
