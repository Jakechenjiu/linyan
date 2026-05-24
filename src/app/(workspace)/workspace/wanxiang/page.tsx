"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Network, Loader2, ArrowRight, Users, RefreshCw, FileText, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

export default function WanxiangPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [seedMaterial, setSeedMaterial] = useState("");
  const [agentCount, setAgentCount] = useState(10);
  const [rounds, setRounds] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [showMirofish, setShowMirofish] = useState(false);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/wanxiang/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          seedMaterial: seedMaterial.trim(),
          agentCount,
          rounds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "推演失败");
      } else {
        setResult(data);
      }
    } catch {
      setError("网络错误，请检查万象推演服务是否已启动");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-wide flex items-center gap-3">
          <Network size={28} className="text-[var(--nebula)]" />
          万象推演
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          多智能体 AI 预测引擎 — 构建平行数字世界，推演未来走向
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3 space-y-6">
          <form onSubmit={handleSimulate} className="space-card rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">推演主题</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例如：如果 OpenAI 发布 GPT-6，自媒体行业会发生什么变化？"
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-card-border text-sm focus:outline-none focus:border-[var(--nebula)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                种子材料（可选，Markdown / 文本）
              </label>
              <textarea
                value={seedMaterial}
                onChange={(e) => setSeedMaterial(e.target.value)}
                rows={6}
                placeholder="粘贴背景资料、数据、文章等作为智能体的初始知识…"
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-card-border text-sm focus:outline-none focus:border-[var(--nebula)] transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Users size={12} /> 智能体数量
                </label>
                <input
                  type="range"
                  min={3}
                  max={50}
                  value={agentCount}
                  onChange={(e) => setAgentCount(+e.target.value)}
                  className="w-full accent-[var(--nebula)]"
                />
                <span className="text-xs text-muted-foreground">{agentCount} 个</span>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                  <RefreshCw size={12} /> 交互轮次
                </label>
                <input
                  type="range"
                  min={2}
                  max={15}
                  value={rounds}
                  onChange={(e) => setRounds(+e.target.value)}
                  className="w-full accent-[var(--nebula)]"
                />
                <span className="text-xs text-muted-foreground">{rounds} 轮</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-[var(--nebula)] hover:shadow-[0_0_24px_rgba(168,85,247,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ color: "#fff" }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  推演中…（可能需要 1-3 分钟）
                </>
              ) : (
                <>
                  <Network size={16} />
                  开始推演
                </>
              )}
            </button>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}
          </form>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="space-card rounded-2xl p-5">
            <h3 className="font-mono text-sm font-bold mb-3 text-[var(--nebula)]">使用指南</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-[var(--nebula)] shrink-0">1.</span>
                填写推演主题，越具体越好
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--nebula)] shrink-0">2.</span>
                可选粘贴种子材料作为背景知识
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--nebula)] shrink-0">3.</span>
                智能体数量越多、轮次越多，结果越丰富，但耗时也更长
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--nebula)] shrink-0">4.</span>
                推演完成后可保存到灵思笔记
              </li>
            </ul>
          </div>

          <div className="space-card rounded-2xl p-5">
            <h3 className="font-mono text-sm font-bold mb-3 text-muted-foreground">从笔记推演</h3>
            <p className="text-xs text-muted-foreground mb-3">
              在灵思笔记中打开任意笔记，点击「万象推演」按钮，将笔记内容作为种子材料直接推演
            </p>
            <Link
              href="/workspace/notes"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--cyan)] hover:underline"
            >
              <FileText size={12} />
              浏览笔记 <ArrowRight size={10} />
            </Link>
          </div>

          {result && (
            <div className="space-card rounded-2xl p-5 border-[var(--nebula)]/20">
              <h3 className="font-mono text-sm font-bold mb-3 text-[var(--nebula)]">推演结果</h3>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-96 overflow-y-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* MiroFish 原生前端 */}
      <div className="space-card rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowMirofish(!showMirofish)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink size={14} className="text-muted-foreground" />
            <span className="font-mono text-sm font-bold">MiroFish 原生面板</span>
            <span className="text-[10px] text-muted-foreground">(需 Docker 运行中)</span>
          </div>
          {showMirofish ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </button>
        {showMirofish && (
          <div className="border-t border-card-border">
            <iframe
              src="/mirofish"
              className="w-full h-[700px]"
              title="MiroFish 原生面板"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        )}
      </div>
    </div>
  );
}
