"use client";

import type { WizardData } from "./CreateWizard";

interface Props { data: WizardData; update: (d: Partial<WizardData>) => void }

export default function WizardStep3Character({ data, update }: Props) {
  const setProtagonist = (p: WizardData["protagonist"]) => update({ protagonist: p });
  const setAntagonist = (a: WizardData["antagonist"]) => update({ antagonist: a });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-mono text-xl font-bold mb-1">角色设计</h2>
        <p className="text-sm text-muted-foreground">核心角色的欲望、缺陷与冲突决定了故事的灵魂</p>
      </div>

      {/* Protagonist */}
      <div className="space-y-4">
        <h3 className="font-mono text-sm font-bold flex items-center gap-2" style={{ color: "var(--cyan)" }}>
          <span className="w-2 h-2 rounded-full bg-[var(--cyan)]" />
          主角 — D-F-W-N-C 五维模型
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">姓名 *</label>
            <input
              value={data.protagonist.name}
              onChange={(e) => setProtagonist({ ...data.protagonist, name: e.target.value })}
              placeholder="主角姓名"
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">称号</label>
            <input
              value={data.protagonist.tagline}
              onChange={(e) => setProtagonist({ ...data.protagonist, tagline: e.target.value })}
              placeholder="如：废柴少年 / 重生仙尊"
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">
              <span style={{ color: "var(--cyan)" }}>Desire 欲望</span> — 外在目标，驱动力必须强到撑起全书
            </label>
            <input
              value={data.protagonist.desire}
              onChange={(e) => setProtagonist({ ...data.protagonist, desire: e.target.value })}
              placeholder="如：成为最强剑仙 / 推翻帝国暴政 / 找到失踪的妹妹"
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">
              <span style={{ color: "#ef4444" }}>Flaw 缺陷</span> — 致命的性格弱点，完美圣人很无聊
            </label>
            <input
              value={data.protagonist.flaw}
              onChange={(e) => setProtagonist({ ...data.protagonist, flaw: e.target.value })}
              placeholder="如：过度傲慢、不信任任何人、沉溺于复仇无法自拔"
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">
              <span style={{ color: "#f0e68c" }}>Golden Finger 金手指</span> — 主角的特殊优势
            </label>
            <input
              value={data.protagonist.goldenFinger}
              onChange={(e) => setProtagonist({ ...data.protagonist, goldenFinger: e.target.value })}
              placeholder="如：系统面板 / 前世记忆 / 上古传承 / 特殊血脉"
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm"
            />
          </div>
        </div>
      </div>

      {/* Antagonist */}
      <div className="space-y-4">
        <h3 className="font-mono text-sm font-bold flex items-center gap-2" style={{ color: "#ef4444" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
          反派 — 主角的镜像（&quot;选错路的主角&quot;）
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">姓名</label>
            <input
              value={data.antagonist.name}
              onChange={(e) => setAntagonist({ ...data.antagonist, name: e.target.value })}
              placeholder="主要反派姓名"
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">定位</label>
            <select
              value={data.antagonist.role}
              onChange={(e) => setAntagonist({ ...data.antagonist, role: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-sm focus:outline-none focus:border-[var(--cyan)]"
            >
              <option value="">选择定位…</option>
              <option value="ideological">理念对立（S级）</option>
              <option value="interest">利益冲突（A级）</option>
              <option value="personal">个人恩怨（B级）</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">核心冲突 — 为什么他/她必然与主角对立？</label>
            <input
              value={data.antagonist.conflict}
              onChange={(e) => setAntagonist({ ...data.antagonist, conflict: e.target.value })}
              placeholder="如：两人追求同一目标但手段截然相反"
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
