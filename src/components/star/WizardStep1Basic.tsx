"use client";

import { genrePresets } from "@/data/genre-presets";
import type { WizardData } from "./CreateWizard";

interface Props { data: WizardData; update: (d: Partial<WizardData>) => void }

export default function WizardStep1Basic({ data, update }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-mono text-xl font-bold mb-1">基本信息</h2>
        <p className="text-sm text-muted-foreground">为你的作品定下基调</p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">书名</label>
        <input
          value={data.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="给你的故事取一个名字…"
          className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors font-mono text-lg"
          autoFocus
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">类型</label>
        <div className="grid grid-cols-4 gap-2">
          {genrePresets.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => update({ genre: g.id })}
              className={`p-3 rounded-xl text-center transition-all border ${
                data.genre === g.id
                  ? "border-[var(--cyan)] bg-[var(--cyan-soft)]"
                  : "border-card-border hover:border-[var(--cyan)] hover:bg-[var(--accent)]"
              }`}
            >
              <div
                className="w-3 h-3 rounded-full mx-auto mb-1"
                style={{ background: g.coverColor }}
              />
              <div className="text-xs font-medium">{g.label}</div>
              <div className="text-[10px] text-muted-foreground">{g.category.slice(0, 4)}</div>
            </button>
          ))}
        </div>
        {data.genre && (
          <p className="text-xs text-muted-foreground mt-2">
            {genrePresets.find((g) => g.id === data.genre)?.description}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">一句话简介</label>
        <input
          value={data.synopsis}
          onChange={(e) => update({ synopsis: e.target.value })}
          placeholder="用一句话概括你的故事核心…"
          className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          目标总字数：<span className="text-[var(--cyan)]">{(data.targetWordCount / 10000).toFixed(0)} 万字</span>
        </label>
        <input
          type="range"
          min={30000}
          max={1000000}
          step={10000}
          value={data.targetWordCount}
          onChange={(e) => update({ targetWordCount: Number(e.target.value) })}
          className="w-full accent-[var(--cyan)]"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>3万</span>
          <span>50万</span>
          <span>100万</span>
        </div>
      </div>
    </div>
  );
}
