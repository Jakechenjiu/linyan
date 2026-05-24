"use client";

import { genrePresets } from "@/data/genre-presets";
import type { WizardData } from "./CreateWizard";

interface Props { data: WizardData; update: (d: Partial<WizardData>) => void }

export default function WizardStep4Outline({ data, update }: Props) {
  const genre = genrePresets.find((g) => g.id === data.genre);

  const addVolume = () => {
    update({
      volumes: [...data.volumes, { title: `第${data.volumes.length + 1}卷`, chapterCount: 10, summary: "" }],
    });
  };

  const updateVolume = (i: number, v: Partial<WizardData["volumes"][0]>) => {
    const vols = [...data.volumes];
    vols[i] = { ...vols[i], ...v };
    update({ volumes: vols });
  };

  const removeVolume = (i: number) => {
    if (data.volumes.length <= 1) return;
    update({ volumes: data.volumes.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-mono text-xl font-bold mb-1">大纲预设</h2>
        <p className="text-sm text-muted-foreground">规划故事的节奏与结构</p>
      </div>

      {/* Opening hook */}
      <div>
        <label className="text-sm font-medium mb-2 block">开篇钩子</label>
        <textarea
          value={data.openingHook}
          onChange={(e) => update({ openingHook: e.target.value })}
          placeholder="第一章发生了什么？用什么冲突或悬念抓住读者？"
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm resize-y"
        />
        {genre && (
          <p className="text-[11px] text-muted-foreground mt-1">
            {genre.label}类型建议：{genre.pacingNote}
          </p>
        )}
      </div>

      {/* Volume structure */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium">卷结构</label>
          <button
            type="button"
            onClick={addVolume}
            className="text-xs text-[var(--cyan)] hover:underline"
          >
            + 添加卷
          </button>
        </div>
        <div className="space-y-3">
          {data.volumes.map((vol, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--accent)] border border-card-border">
              <span className="text-xs text-muted-foreground mt-2 w-12 shrink-0">
                {vol.title || `第${i + 1}卷`}
              </span>
              <div className="flex-1 space-y-2">
                <input
                  value={vol.title}
                  onChange={(e) => updateVolume(i, { title: e.target.value })}
                  placeholder="卷标题"
                  className="w-full px-3 py-1.5 rounded-lg bg-transparent border border-card-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors"
                />
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={vol.chapterCount}
                    onChange={(e) => updateVolume(i, { chapterCount: Number(e.target.value) })}
                    className="w-16 px-2 py-1 rounded-lg bg-transparent border border-card-border text-foreground text-sm focus:outline-none focus:border-[var(--cyan)]"
                  />
                  <span className="text-xs text-muted-foreground">章</span>
                  <input
                    value={vol.summary}
                    onChange={(e) => updateVolume(i, { summary: e.target.value })}
                    placeholder="本卷概要（一句话）"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-transparent border border-card-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors"
                  />
                </div>
              </div>
              {data.volumes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVolume(i)}
                  className="text-xs text-muted-foreground hover:text-red-400 mt-2"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-[var(--cyan-soft)] border border-[var(--cyan)] border-opacity-20">
        <h4 className="font-mono text-sm font-bold text-[var(--cyan)] mb-3">创建确认</h4>
        <div className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16 shrink-0">书名：</span>
            <span className="text-foreground font-medium">{data.title || "（未填写）"}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16 shrink-0">类型：</span>
            <span className="text-foreground">{genre?.label ?? "（未选择）"}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16 shrink-0">字数：</span>
            <span className="text-foreground">{(data.targetWordCount / 10000).toFixed(0)} 万字</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16 shrink-0">主角：</span>
            <span className="text-foreground">{data.protagonist.name || "（未设定）"}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16 shrink-0">卷数：</span>
            <span className="text-foreground">{data.volumes.length} 卷 / {data.volumes.reduce((s, v) => s + v.chapterCount, 0)} 章</span>
          </div>
        </div>
      </div>
    </div>
  );
}
