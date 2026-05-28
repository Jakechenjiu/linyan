"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";

const suggestions = [
  { text: "帮我写一个玄幻小说的大纲", href: "/workspace/star/create" },
  { text: "做一个关于AI的短视频", href: "/workspace/photon" },
  { text: "分析一下自媒体行业的趋势", href: "/workspace/wanxiang" },
  { text: "帮我整理一下笔记", href: "/workspace/notes" },
];

export default function DashboardAI() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);

    // Simple routing based on keywords
    const text = input.toLowerCase();
    if (text.includes("小说") || text.includes("写书") || text.includes("章节")) {
      router.push("/workspace/star");
    } else if (text.includes("视频") || text.includes("短片") || text.includes("发布")) {
      router.push("/workspace/photon");
    } else if (text.includes("笔记") || text.includes("记录") || text.includes("知识")) {
      router.push("/workspace/notes");
    } else if (text.includes("推演") || text.includes("分析") || text.includes("预测")) {
      router.push("/workspace/wanxiang");
    } else {
      // Default: go to star for writing
      router.push("/workspace/star");
    }

    setLoading(false);
  };

  return (
    <div className="space-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={14} className="text-[var(--cyan)]" />
        <span className="text-xs font-medium">AI 助手</span>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="告诉我你想做什么…"
          className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="p-2.5 rounded-xl bg-[var(--cyan)] text-[#0a0e17] hover:opacity-90 transition-all disabled:opacity-40"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s.text}
            onClick={() => router.push(s.href)}
            className="px-3 py-1.5 rounded-lg text-[10px] bg-[var(--accent)] text-muted-foreground hover:text-foreground hover:bg-[var(--accent)]/80 transition-colors"
          >
            {s.text}
          </button>
        ))}
      </div>
    </div>
  );
}
