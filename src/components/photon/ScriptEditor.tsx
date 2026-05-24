"use client";

import { useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";

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

interface Props {
  clip: ClipData;
  onSave: (data: { scriptText: string; visualPrompt: string; duration: number }) => void;
  onDelete?: () => void;
}

export default function ScriptEditor({ clip, onSave, onDelete }: Props) {
  const [scriptText, setScriptText] = useState(clip.scriptText);
  const [visualPrompt, setVisualPrompt] = useState(clip.visualPrompt);
  const [duration, setDuration] = useState(clip.duration);

  return (
    <div className="space-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold font-mono">
          分镜 #{clip.order + 1}
          <span className="text-xs text-muted-foreground ml-2 font-normal">编辑</span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSave({ scriptText, visualPrompt, duration })}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--cyan-soft)] text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-[#0a0e17] transition-all"
          >
            <Save size={12} /> 保存
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">旁白文案</label>
          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors resize-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">画面描述 (visualPrompt)</label>
          <textarea
            value={visualPrompt}
            onChange={(e) => setVisualPrompt(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-card-border text-xs font-mono focus:outline-none focus:border-[var(--cyan)] transition-colors resize-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">时长 (秒)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseFloat(e.target.value) || 5)}
            step={0.5}
            min={1}
            max={30}
            className="w-24 px-3 py-1.5 rounded-lg bg-[var(--background)] border border-card-border text-sm font-mono focus:outline-none focus:border-[var(--cyan)] transition-colors"
          />
        </div>
      </div>

      {/* Preview */}
      {clip.clipUrl && (
        <div className="rounded-xl overflow-hidden bg-[var(--background)] border border-card-border">
          <video src={clip.clipUrl} controls className="w-full max-h-64" />
        </div>
      )}
    </div>
  );
}
