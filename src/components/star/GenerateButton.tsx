"use client";

import { useState } from "react";
import { Sparkles, Loader2, BookOpen, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Props {
  novelId: string;
  outlineId: string;
  hasChapter: boolean;
  chapterId?: string;
}

export default function GenerateButton({ novelId, outlineId, hasChapter, chapterId }: Props) {
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [createdChapterId, setCreatedChapterId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setStatus("正在生成写作任务书…");
    setCreatedChapterId(null);

    try {
      const res = await fetch(`/api/novels/${novelId}/auto-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outlineId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "生成失败" }));
        setStatus(`错误: ${err.error}`);
        setGenerating(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setGenerating(false); return; }

      const decoder = new TextDecoder();
      let buffer = "";

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
            if (data.type === "status") {
              setStatus(data.message);
            } else if (data.type === "text") {
              setStatus("正在写作…");
            } else if (data.type === "done") {
              setStatus(`完成！${data.wordCount} 字`);
              setCreatedChapterId(data.chapterId);
            } else if (data.type === "error") {
              setStatus(`错误: ${data.message}`);
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setStatus(`错误: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <span className="flex items-center gap-1">
      {generating ? (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Loader2 size={10} className="animate-spin" /> {status}
        </span>
      ) : status && !generating ? (
        <span className={`text-[10px] ${status.startsWith("错误") ? "text-red-400" : "text-[var(--cyan)]"}`}>
          {status}
        </span>
      ) : null}

      {createdChapterId ? (
        <Link
          href={`/workspace/star/${novelId}#chapter-${createdChapterId}`}
          className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[var(--cyan)] text-[#0a0e17] hover:shadow-[0_0_12px_rgba(0,229,255,0.3)] transition-all"
        >
          <BookOpen size={10} /> 查看
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-card-border text-[var(--nebula)] hover:border-[var(--nebula)] hover:bg-[var(--nebula)]/10 transition-all disabled:opacity-50"
        >
          {hasChapter ? <RefreshCw size={10} /> : <Sparkles size={10} />}
          {hasChapter ? "重新生成" : "生成"}
        </button>
      )}
    </span>
  );
}
