"use client";

import { GripVertical, Play, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

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

const statusConfig: Record<string, { icon: typeof CheckCircle2; label: string; className: string }> = {
  pending: { icon: AlertCircle, label: "待生成", className: "text-muted-foreground" },
  generating: { icon: Loader2, label: "生成中", className: "text-[var(--star)]" },
  done: { icon: CheckCircle2, label: "已完成", className: "text-green-400" },
  failed: { icon: AlertCircle, label: "失败", className: "text-red-400" },
};

interface Props {
  clip: ClipData;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (field: string, value: string | number) => void;
  dragHandleProps?: Record<string, unknown>;
}

export default function ClipCard({ clip, isSelected, onSelect, onEdit, dragHandleProps }: Props) {
  const cfg = statusConfig[clip.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;

  return (
    <div
      onClick={onSelect}
      className={`group relative flex gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? "border-[var(--cyan)] bg-[var(--cyan-soft)]"
          : "border-card-border hover:border-[var(--cyan)] hover:bg-[var(--accent)]"
      }`}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="shrink-0 mt-1 text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
        {...dragHandleProps}
      >
        <GripVertical size={14} />
      </button>

      {/* Thumbnail */}
      <div className="shrink-0 w-20 h-28 rounded-lg bg-[var(--background)] border border-card-border overflow-hidden flex items-center justify-center">
        {clip.clipUrl ? (
          <video src={clip.clipUrl} className="w-full h-full object-cover" muted />
        ) : (
          <Play size={16} className="text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)] text-muted-foreground font-mono">
            #{clip.order + 1}
          </span>
          <span className="text-[10px] text-muted-foreground">{clip.duration.toFixed(1)}s</span>
          <span className={`flex items-center gap-1 text-[10px] ${cfg.className}`}>
            <StatusIcon size={10} className={clip.status === "generating" ? "animate-spin" : ""} />
            {cfg.label}
          </span>
        </div>

        <p className="text-xs leading-relaxed line-clamp-2">{clip.scriptText}</p>
        <p className="text-[10px] text-muted-foreground line-clamp-1">{clip.visualPrompt}</p>
      </div>
    </div>
  );
}
