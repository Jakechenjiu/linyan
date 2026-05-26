"use client";

import { useState } from "react";
import { Save, Trash2, ChevronDown, ChevronRight } from "lucide-react";

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  location: { label: "地点", color: "bg-emerald-500/20 text-emerald-400" },
  faction: { label: "势力", color: "bg-amber-500/20 text-amber-400" },
  event: { label: "事件", color: "bg-purple-500/20 text-purple-400" },
  item: { label: "物品", color: "bg-sky-500/20 text-sky-400" },
  creature: { label: "生物", color: "bg-orange-500/20 text-orange-400" },
  world_rule: { label: "世界规则", color: "bg-red-500/20 text-red-400" },
  custom: { label: "自定义", color: "bg-gray-500/20 text-gray-400" },
};

interface CodexEntry {
  id: string;
  type: string;
  name: string;
  summary: string | null;
  body: string | null;
  keywords: string;
}

export default function CodexEntryCard({
  entry,
  saveAction,
  deleteAction,
}: {
  entry: CodexEntry;
  saveAction: (id: string, formData: FormData) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(entry.name);
  const [type, setType] = useState(entry.type);
  const [summary, setSummary] = useState(entry.summary || "");
  const [body, setBody] = useState(entry.body || "");
  const [keywords, setKeywords] = useState(
    JSON.parse(entry.keywords || "[]").join(", ")
  );

  const typeConfig = TYPE_CONFIG[type] || TYPE_CONFIG.custom;

  const handleSave = async () => {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("type", type);
    formData.set("summary", summary);
    formData.set("body", body);
    formData.set("keywords", JSON.stringify(keywords.split(",").map((k: string) => k.trim()).filter(Boolean)));
    await saveAction(entry.id, formData);
  };

  return (
    <div className="space-card rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 font-medium text-sm bg-transparent border-0 focus:outline-none focus:border-b focus:border-[var(--cyan)]"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={`px-2 py-0.5 rounded text-[10px] font-medium border-0 focus:outline-none ${typeConfig.color}`}
          style={{ background: "transparent" }}
        >
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <button onClick={handleSave} className="text-[var(--cyan)] hover:underline">
          <Save size={12} />
        </button>
        <button onClick={() => deleteAction(entry.id)} className="text-muted-foreground hover:text-red-400">
          <Trash2 size={12} />
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-card-border pt-2">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">摘要（AI 上下文用）</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              placeholder="简短描述，用于 AI 生成时的上下文注入…"
              className="w-full px-2 py-1.5 rounded-lg bg-[var(--accent)] border border-card-border text-xs focus:outline-none focus:border-[var(--cyan)] resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">详细描述</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="详细设定、描述…"
              className="w-full px-2 py-1.5 rounded-lg bg-[var(--accent)] border border-card-border text-xs focus:outline-none focus:border-[var(--cyan)] resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">关键词（逗号分隔，AI 自动匹配）</label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="关键词1, 关键词2, …"
              className="w-full px-2 py-1.5 rounded-lg bg-[var(--accent)] border border-card-border text-xs focus:outline-none focus:border-[var(--cyan)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
