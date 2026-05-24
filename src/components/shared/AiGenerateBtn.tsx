"use client";

import { useState, useRef } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface Props {
  novelId: string;
  chapterId: string;
  direction?: string;
  onText: (text: string) => void;
  className?: string;
}

export default function AiGenerateBtn({ novelId, chapterId, direction, onText, className = "" }: Props) {
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    setStreaming(true);
    setError(null);
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch(`/api/novels/${novelId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId, direction }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "生成失败");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        onText(text);
      }

      onText(text);
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

  return (
    <div className="inline-flex items-center gap-2">
      {streaming ? (
        <button
          type="button"
          onClick={handleStop}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors ${className}`}
        >
          <Loader2 size={12} className="animate-spin" /> 停止生成
        </button>
      ) : (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={streaming}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-card-border hover:border-[var(--nebula)] text-[var(--nebula)] transition-colors disabled:opacity-50 ${className}`}
        >
          <Sparkles size={12} /> AI 续写
        </button>
      )}
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
}
