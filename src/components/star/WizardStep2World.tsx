"use client";

import { worldTemplates } from "@/data/world-templates";
import type { WizardData } from "./CreateWizard";

interface Props { data: WizardData; update: (d: Partial<WizardData>) => void }

export default function WizardStep2World({ data, update }: Props) {
  const applyTemplate = (id: string) => {
    const t = worldTemplates.find((wt) => wt.id === id);
    if (!t) {
      update({ worldTemplate: "", worldType: "", scale: "", powerSystem: "", geography: "", factions: "", rules: "" });
      return;
    }
    update({
      worldTemplate: t.id,
      worldType: t.worldType,
      scale: t.scale,
      powerSystem: t.powerSystem,
      geography: t.geography,
      factions: t.factions,
      rules: t.rules,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-mono text-xl font-bold mb-1">世界观设定</h2>
        <p className="text-sm text-muted-foreground">构建故事世界的物理法则与势力版图</p>
      </div>

      {/* Template selection */}
      <div>
        <label className="text-sm font-medium mb-2 block">快速模板（可选）</label>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => applyTemplate("")}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
              !data.worldTemplate ? "border-[var(--cyan)] bg-[var(--cyan-soft)] text-[var(--cyan)]" : "border-card-border text-muted-foreground hover:border-[var(--cyan)]"
            }`}
          >
            自定义
          </button>
          {worldTemplates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                data.worldTemplate === t.id
                  ? "border-[var(--cyan)] bg-[var(--cyan-soft)] text-[var(--cyan)]"
                  : "border-card-border text-muted-foreground hover:border-[var(--cyan)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* World type + scale */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">世界类型</label>
          <select
            value={data.worldType}
            onChange={(e) => update({ worldType: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-sm focus:outline-none focus:border-[var(--cyan)]"
          >
            <option value="">不指定</option>
            <option value="cultivation">修炼文明</option>
            <option value="cyberpunk">赛博朋克</option>
            <option value="cthulhu">克苏鲁</option>
            <option value="wasteland">废土末世</option>
            <option value="modern">现代都市</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">世界规模</label>
          <select
            value={data.scale}
            onChange={(e) => update({ scale: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-sm focus:outline-none focus:border-[var(--cyan)]"
          >
            <option value="">不指定</option>
            <option value="single_city">单城</option>
            <option value="multi_region">多区域</option>
            <option value="continent">大陆级</option>
            <option value="multi_realm">多界域</option>
          </select>
        </div>
      </div>

      {/* Editable template fields */}
      <div>
        <label className="text-sm font-medium mb-2 block">力量体系</label>
        <textarea
          value={data.powerSystem}
          onChange={(e) => update({ powerSystem: e.target.value })}
          placeholder="描述这个世界的修炼/能力体系，包括等级划分、资源获取、代价与限制…"
          rows={5}
          className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm font-mono resize-y"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">势力格局</label>
        <textarea
          value={data.factions}
          onChange={(e) => update({ factions: e.target.value })}
          placeholder="谁掌控着这个世界？有哪些对立势力？他们的目标和冲突是什么？"
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm font-mono resize-y"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">世界铁律</label>
        <textarea
          value={data.rules}
          onChange={(e) => update({ rules: e.target.value })}
          placeholder="这个世界不可打破的规则是什么？（至少3条）"
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm font-mono resize-y"
        />
      </div>
    </div>
  );
}
