"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, Send, Loader2, MessageSquare } from "lucide-react";

export default function GlobalAI() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);

    const text = input.toLowerCase();
    setInput("");
    setOpen(false);

    // Route based on intent
    if (text.includes("小说") || text.includes("写书") || text.includes("章节") || text.includes("创作")) {
      router.push("/workspace/star");
    } else if (text.includes("视频") || text.includes("短片") || text.includes("发布") || text.includes("内容")) {
      router.push("/workspace/photon");
    } else if (text.includes("笔记") || text.includes("记录") || text.includes("知识") || text.includes("整理")) {
      router.push("/workspace/notes");
    } else if (text.includes("推演") || text.includes("分析") || text.includes("预测") || text.includes("模拟")) {
      router.push("/workspace/wanxiang");
    } else if (text.includes("设置") || text.includes("配置") || text.includes("api")) {
      router.push("/workspace/settings");
    } else {
      // Default: go to star for writing
      router.push("/workspace/star");
    }

    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[var(--cyan)] text-[#0a0e17] shadow-lg hover:shadow-[0_0_24px_rgba(0,229,255,0.4)] transition-all flex items-center justify-center"
        title="AI 助手 (Ctrl+K)"
      >
        <MessageSquare size={20} />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-24 px-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

          {/* Dialog */}
          <div className="relative w-full max-w-lg space-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--cyan)]" />
                <span className="text-sm font-medium">AI 助手</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-[var(--accent)]">Ctrl+K</span>
                <button onClick={() => setOpen(false)} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="告诉我你想做什么…"
                rows={2}
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors resize-none"
              />
              <button
                onClick={handleSubmit}
                disabled={loading || !input.trim()}
                className="p-3 rounded-xl bg-[var(--cyan)] text-[#0a0e17] hover:opacity-90 transition-all disabled:opacity-40"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { text: "写小说", href: "/workspace/star" },
                { text: "做视频", href: "/workspace/photon" },
                { text: "记笔记", href: "/workspace/notes" },
                { text: "做推演", href: "/workspace/wanxiang" },
                { text: "设置", href: "/workspace/settings" },
              ].map((s) => (
                <button
                  key={s.text}
                  onClick={() => { router.push(s.href); setOpen(false); }}
                  className="px-3 py-1.5 rounded-lg text-[10px] bg-[var(--accent)] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
