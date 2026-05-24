"use client";

import { useRef, useState, useCallback } from "react";
import ClipCard from "./ClipCard";

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

interface Props {
  clips: ClipData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onEdit: (id: string, field: string, value: string | number) => void;
}

export default function TimelineBar({ clips, selectedId, onSelect, onReorder, onEdit }: Props) {
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
    setDragActive(true);
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    dragOver.current = index;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
      onReorder(dragItem.current, dragOver.current);
    }
    dragItem.current = null;
    dragOver.current = null;
    setDragActive(false);
  }, [onReorder]);

  // Timeline total duration
  const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0);

  return (
    <div className="space-y-2">
      {/* Timeline header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          时间线 · {clips.length} 个分镜 · {totalDuration.toFixed(0)}s
        </span>
      </div>

      {/* Horizontal timeline bar */}
      <div className="h-2 rounded-full bg-[var(--accent)] border border-card-border overflow-hidden flex">
        {clips.map((clip, i) => (
          <div
            key={clip.id}
            className={`h-full transition-colors cursor-pointer border-r border-[var(--background)] last:border-r-0 ${
              clip.status === "done"
                ? "bg-green-500/40"
                : clip.status === "generating"
                  ? "bg-[var(--star)]/40"
                  : clip.status === "failed"
                    ? "bg-red-500/40"
                    : "bg-card-border"
            } ${selectedId === clip.id ? "ring-1 ring-[var(--cyan)]" : ""}`}
            style={{ width: `${(clip.duration / totalDuration) * 100}%` }}
            onClick={() => onSelect(clip.id)}
          />
        ))}
      </div>

      {/* Clip cards with drag-and-drop */}
      <div className="space-y-2">
        {clips.map((clip, i) => (
          <div
            key={clip.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragEnter={() => handleDragEnter(i)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`transition-all ${dragActive && dragItem.current === i ? "opacity-50 scale-95" : ""}`}
          >
            <ClipCard
              clip={clip}
              isSelected={selectedId === clip.id}
              onSelect={() => onSelect(clip.id)}
              onEdit={(field, value) => onEdit(clip.id, field, value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
