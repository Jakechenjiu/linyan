"use client";

import { useState } from "react";
import { Save, Trash2 } from "lucide-react";

interface Character {
  id: string;
  name: string;
  role: string;
  tagline?: string | null;
  personality?: string | null;
  desire?: string | null;
  flaw?: string | null;
  wound?: string | null;
  need?: string | null;
  change?: string | null;
  goldenFinger?: string | null;
  relationships?: string | null;
}

const roleLabels: Record<string, { label: string; color: string }> = {
  protagonist: { label: "主角", color: "var(--cyan)" },
  antagonist: { label: "反派", color: "#ef4444" },
  love_interest: { label: "感情线", color: "#ec4899" },
  mentor: { label: "导师", color: "#f0e68c" },
  supporting: { label: "配角", color: "" },
};

export default function CharacterCard({
  character,
  onSave,
  onDelete,
}: {
  character: Character;
  onSave: (id: string, data: Partial<Character>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState({
    tagline: character.tagline || "",
    personality: character.personality || "",
    desire: character.desire || "",
    flaw: character.flaw || "",
    wound: character.wound || "",
    need: character.need || "",
    change: character.change || "",
    goldenFinger: character.goldenFinger || "",
  });

  const handleSave = async () => {
    await onSave(character.id, data);
    setEditing(false);
  };

  const role = roleLabels[character.role] || roleLabels.supporting;

  return (
    <div className="space-card rounded-xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-lg">{character.name}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)] text-muted-foreground">
            {role.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs text-[var(--cyan)] hover:underline"
          >
            {editing ? "取消" : "编辑"}
          </button>
          <button
            onClick={() => onDelete(character.id)}
            className="text-xs text-muted-foreground hover:text-red-400"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {editing ? (
        /* Edit mode */
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "tagline", label: "称号", placeholder: "如：废柴少年 / 重生仙尊" },
              { key: "desire", label: "Desire 欲望", placeholder: "外在驱动力" },
              { key: "flaw", label: "Flaw 缺陷", placeholder: "致命的性格弱点" },
              { key: "wound", label: "Wound 创伤", placeholder: "过去的伤痛" },
              { key: "need", label: "Need 内在需求", placeholder: "真正需要的" },
              { key: "change", label: "Change 成长", placeholder: "心态变化轨迹" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">
                  {key === "desire" ? <span style={{ color: "var(--cyan)" }}>{label}</span> :
                   key === "flaw" ? <span style={{ color: "#ef4444" }}>{label}</span> : label}
                </label>
                <input
                  value={(data as any)[key]}
                  onChange={(e) => setData((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-2 py-1 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors"
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-[10px] text-muted-foreground mb-0.5 block">
                <span style={{ color: "#f0e68c" }}>Golden Finger 金手指</span>
              </label>
              <input
                value={data.goldenFinger}
                onChange={(e) => setData((prev) => ({ ...prev, goldenFinger: e.target.value }))}
                placeholder="特殊的优势或能力"
                className="w-full px-2 py-1 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-muted-foreground mb-0.5 block">性格</label>
              <textarea
                value={data.personality}
                onChange={(e) => setData((prev) => ({ ...prev, personality: e.target.value }))}
                rows={2}
                placeholder="显性性格 + 隐性性格"
                className="w-full px-2 py-1 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors resize-y"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--cyan)] text-[#0a0e17] hover:opacity-90 transition-all"
          >
            <Save size={12} /> 保存
          </button>
        </div>
      ) : (
        /* View mode */
        <div className="space-y-2 text-xs">
          {character.tagline && <p><span className="text-muted-foreground">称号：</span>{character.tagline}</p>}
          {character.personality && <p><span className="text-muted-foreground">性格：</span>{character.personality}</p>}
          {character.desire && <p><span className="text-muted-foreground">欲望：</span>{character.desire}</p>}
          {character.flaw && <p><span className="text-muted-foreground">缺陷：</span>{character.flaw}</p>}
          {character.goldenFinger && <p><span className="text-muted-foreground">金手指：</span>{character.goldenFinger}</p>}
        </div>
      )}
    </div>
  );
}
