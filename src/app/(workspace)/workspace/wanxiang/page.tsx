"use client";

import { useState, useEffect, useCallback } from "react";
import { Network, Loader2, ArrowRight, Users, RefreshCw, FileText, ExternalLink, ChevronDown, ChevronUp, Sparkles, Settings2, Plus, Trash2, Clock } from "lucide-react";
import Link from "next/link";
import WanxiangResult from "@/components/shared/WanxiangResult";
import ImportButton from "@/components/shared/ImportButton";

const rolePresets = [
  { name: "分析师", role: "冷静客观的数据分析师，擅长从数据和事实中提炼洞察" },
  { name: "反对者", role: "持怀疑态度，善于发现逻辑漏洞和潜在风险" },
  { name: "乐观派", role: "对未来持积极态度，关注机遇和可能性" },
  { name: "悲观派", role: "对事物持谨慎态度，关注最坏情况和脆弱环节" },
  { name: "领域专家", role: "在相关领域有深厚专业知识的技术权威" },
  { name: "随大流", role: "代表普通大众的观点和判断，容易从众" },
  { name: "创新者", role: "善于提出颠覆性想法和非传统解决方案" },
  { name: "保守派", role: "倾向于维持现状，强调稳定和渐进式变革" },
];

interface AgentConfig {
  name: string;
  role: string;
}

interface HistoryItem {
  id: string;
  topic: string;
  agentCount: number;
  rounds: number;
  status: string;
  result: string | null;
  createdAt: string;
}

export default function WanxiangPage() {
  const [topic, setTopic] = useState("");
  const [seedMaterial, setSeedMaterial] = useState("");
  const [agentCount, setAgentCount] = useState(10);
  const [rounds, setRounds] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [showMirofish, setShowMirofish] = useState(false);
  const [showAgentConfig, setShowAgentConfig] = useState(false);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  // Generate default agents when count changes
  const generateAgents = useCallback((count: number) => {
    const result: AgentConfig[] = [];
    for (let i = 0; i < count; i++) {
      const preset = rolePresets[i % rolePresets.length];
      result.push({
        name: `${preset.name}${Math.floor(i / rolePresets.length) > 0 ? Math.floor(i / rolePresets.length) + 1 : ""}`,
        role: preset.role,
      });
    }
    setAgents(result.slice(0, count));
  }, []);

  useEffect(() => {
    if (agents.length === 0 && agentCount > 0) {
      generateAgents(agentCount);
    }
  }, [agentCount, agents.length, generateAgents]);

  useEffect(() => {
    if (agents.length < agentCount) {
      const toAdd = agentCount - agents.length;
      const newAgents: AgentConfig[] = [];
      const startIdx = agents.length;
      for (let i = 0; i < toAdd; i++) {
        const preset = rolePresets[(startIdx + i) % rolePresets.length];
        newAgents.push({
          name: `${preset.name}${Math.floor((startIdx + i) / rolePresets.length) > 0 ? Math.floor((startIdx + i) / rolePresets.length) + 1 : ""}`,
          role: preset.role,
        });
      }
      setAgents((prev) => [...prev, ...newAgents]);
    } else if (agents.length > agentCount) {
      setAgents((prev) => prev.slice(0, agentCount));
    }
  }, [agentCount]);

  // Load history
  useEffect(() => {
    setHistoryLoading(true);
    fetch("/api/wanxiang/history")
      .then((res) => res.json())
      .then((data) => setHistory(data.simulations || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [result]);

  const updateAgent = (i: number, field: keyof AgentConfig, value: string) => {
    setAgents((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const removeAgent = (i: number) => {
    setAgents((prev) => prev.filter((_, idx) => idx !== i));
    setAgentCount((prev) => Math.max(3, prev - 1));
  };

  const addAgent = () => {
    const preset = rolePresets[agents.length % rolePresets.length];
    setAgents((prev) => [...prev, {
      name: `${preset.name}${Math.floor(agents.length / rolePresets.length) > 0 ? Math.floor(agents.length / rolePresets.length) + 1 : ""}`,
      role: preset.role,
    }]);
    setAgentCount((prev) => Math.min(50, prev + 1));
  };

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
          agents: showAgentConfig ? agents : undefined,
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

  const handleDeleteHistory = async (id: string) => {
    await fetch(`/api/wanxiang/history?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setHistory((prev) => prev.filter((h) => h.id !== id));
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
          <form onSubmit={handleSimulate} className="glass-card rounded-2xl p-6 space-y-5">
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
                <ImportButton type="seed" accept=".txt,.md,.json" variant="text" label="从文件导入" onSeedContent={(content) => setSeedMaterial(content)} />
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

            {/* Agent Configuration */}
            <div>
              <button
                type="button"
                onClick={() => setShowAgentConfig(!showAgentConfig)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings2 size={14} className="text-[var(--nebula)]" />
                智能体配置
                {showAgentConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showAgentConfig && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto p-3 rounded-xl bg-[var(--bg-elevated)] border border-card-border">
                  {agents.map((agent, i) => (
                    <div key={i} className="flex items-center gap-2 group">
                      <span className="text-[10px] text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                      <input
                        value={agent.name}
                        onChange={(e) => updateAgent(i, "name", e.target.value)}
                        className="flex-1 px-2 py-1 rounded bg-[var(--background)] border border-card-border text-xs font-mono focus:outline-none focus:border-[var(--nebula)] transition-colors"
                        placeholder="名称"
                      />
                      <input
                        value={agent.role}
                        onChange={(e) => updateAgent(i, "role", e.target.value)}
                        className="flex-[2] px-2 py-1 rounded bg-[var(--background)] border border-card-border text-xs focus:outline-none focus:border-[var(--nebula)] transition-colors"
                        placeholder="角色描述"
                      />
                      <button
                        type="button"
                        onClick={() => removeAgent(i)}
                        className="p-1 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAgent}
                    className="flex items-center gap-1 text-[10px] text-[var(--nebula)] hover:text-[var(--cyan)] transition-colors"
                  >
                    <Plus size={11} /> 添加智能体
                  </button>
                </div>
              )}
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
                展开「智能体配置」自定义角色和立场
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--nebula)] shrink-0">4.</span>
                智能体数量越多、轮次越多，结果越丰富，但耗时也更长
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--nebula)] shrink-0">5.</span>
                推演完成后可 AI 深度分析或导出 Markdown
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

          {result && <WanxiangResult data={result} />}

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles size={40} className="text-muted-foreground/20 mb-3 animate-float" />
              <p className="text-xs text-muted-foreground">输入主题，启动万象推演</p>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="space-card rounded-2xl p-6">
        <h3 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
          <Clock size={18} className="text-[var(--star)]" />
          历史推演
        </h3>
        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            还没有推演记录，完成一次推演后自动保存
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="border border-card-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-3 hover:bg-white/[0.01] transition-colors">
                  <button
                    type="button"
                    onClick={() => setExpandedHistory(expandedHistory === h.id ? null : h.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{h.topic}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        h.status === "completed" ? "bg-green-500/10 text-green-400" :
                        h.status === "running" ? "bg-[var(--star)]/10 text-[var(--star)]" :
                        "bg-red-500/10 text-red-400"
                      }`}>
                        {h.status === "completed" ? "已完成" : h.status === "running" ? "进行中" : "失败"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {h.agentCount} 智能体 · {h.rounds} 轮 · {new Date(h.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteHistory(h.id)}
                    className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {expandedHistory === h.id && h.result && (
                  <div className="border-t border-card-border p-3">
                    {(() => {
                      try {
                        const data = JSON.parse(h.result);
                        return <WanxiangResult data={data} />;
                      } catch {
                        return <p className="text-xs text-muted-foreground">无法解析结果</p>;
                      }
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
