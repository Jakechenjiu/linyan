"use client";

import { useState, useEffect, useRef } from "react";
import {
  Wand2, Expand, Shrink, Languages, Sparkles,
  Loader2, Check, X,
} from "lucide-react";

interface InlineAIToolbarProps {
  selectedText: string;
  position: { x: number; y: number };
  onApply: (newText: string) => void;
  onCancel: () => void;
  novelId: string;
  chapterId: string;
}

type ActionMode = "rewrite" | "expand" | "compress" | "translate" | "describe" | null;

const ACTIONS = [
  { id: "rewrite" as const, label: "改写", icon: Wand2, desc: "保持意思，换种说法" },
  { id: "expand" as const, label: "扩写", icon: Expand, desc: "增加细节和描写" },
  { id: "compress" as const, label: "精简", icon: Shrink, desc: "删除冗余，更紧凑" },
  { id: "describe" as const, label: "描写", icon: Sparkles, desc: "用五感丰富这段" },
];

export default function InlineAIToolbar({
  selectedText,
  position,
  onApply,
  onCancel,
  novelId,
  chapterId,
}: InlineAIToolbarProps) {
  const [mode, setMode] = useState<ActionMode>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onCancel]);

  // Escape 关闭
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  const handleAction = async (actionId: ActionMode) => {
    setMode(actionId);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/novels/${novelId}/inline-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId,
          selectedText,
          action: actionId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "AI 处理失败");
      }

      const data = await res.json();
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "处理失败");
    } finally {
      setLoading(false);
    }
  };

  // 调整位置，确保不超出屏幕
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 320),
    y: Math.min(position.y, window.innerHeight - 200),
  };

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      {/* 动作选择 */}
      {!mode && !result && (
        <div className="bg-[var(--background)] border border-card-border rounded-xl shadow-xl p-1.5 flex items-center gap-0.5">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-[var(--accent)] transition-colors"
              title={action.desc}
            >
              <action.icon size={12} />
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* 加载中 */}
      {mode && loading && (
        <div className="bg-[var(--background)] border border-card-border rounded-xl shadow-xl px-4 py-3 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin text-[var(--cyan)]" />
          <span className="text-[12px] text-muted-foreground">
            {ACTIONS.find((a) => a.id === mode)?.label}中...
          </span>
        </div>
      )}

      {/* 结果预览 */}
      {result && !loading && (
        <div className="bg-[var(--background)] border border-card-border rounded-xl shadow-xl w-[360px] max-h-[300px] flex flex-col">
          {/* 标题 */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-card-border shrink-0">
            <span className="text-[11px] font-medium text-muted-foreground">
              {ACTIONS.find((a) => a.id === mode)?.label}结果
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onApply(result);
                  onCancel();
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-[var(--cyan)] text-[#0a0e17] hover:opacity-90 transition-all"
              >
                <Check size={11} /> 应用
              </button>
              <button
                onClick={onCancel}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* 内容 */}
          <div className="flex-1 overflow-y-auto p-3">
            <p className="text-[12px] leading-relaxed whitespace-pre-wrap">
              {result}
            </p>
          </div>

          {/* 原文对比 */}
          <div className="border-t border-card-border p-3 shrink-0">
            <p className="text-[10px] text-muted-foreground mb-1">原文：</p>
            <p className="text-[11px] text-muted-foreground/70 line-clamp-3">
              {selectedText}
            </p>
          </div>
        </div>
      )}

      {/* 错误 */}
      {error && !loading && (
        <div className="bg-[var(--background)] border border-red-500/30 rounded-xl shadow-xl px-4 py-3">
          <p className="text-[11px] text-red-400">{error}</p>
          <button
            onClick={onCancel}
            className="mt-2 text-[10px] text-muted-foreground hover:text-foreground"
          >
            关闭
          </button>
        </div>
      )}
    </div>
  );
}
