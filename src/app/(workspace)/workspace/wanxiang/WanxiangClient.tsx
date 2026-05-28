"use client";

import { useState, useEffect } from "react";
import { Network, Loader2, ArrowRight, Users, RefreshCw, FileText, ExternalLink, ChevronDown, ChevronUp, Sparkles, Settings2, Plus, Trash2, Clock, Brain, Download, Bookmark, BarChart3 } from "lucide-react";
import Link from "next/link";
import WanxiangResult from "@/components/shared/WanxiangResult";
import ImportButton from "@/components/shared/ImportButton";
import { agentPresets, scenarioTemplates, getPresetsByCategory } from "@/lib/wanxiang/presets";
import type { AnalysisResult } from "@/lib/wanxiang/analysis";

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

const categoryLabels: Record<string, string> = {
  analysis: "分析类",
  creative: "创意类",
  caution: "谨慎类",
  industry: "行业类",
  social: "社会类",
};

export default function WanxiangPage() {
  const [topic, setTopic] = useState("");
  const [seedMaterial, setSeedMaterial] = useState("");
  const [agentCount, setAgentCount] = useState(10);
  const [rounds, setRounds] = useState(5);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [showAgentConfig, setShowAgentConfig] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [agents, setAgents] = useState<AgentConfig[]>(() => agentPresets.slice(0, 10).map((p) => ({ name: p.name, role: p.role })));
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

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
    const preset = agentPresets[agents.length % agentPresets.length];
    setAgents((prev) => [...prev, { name: preset.name, role: preset.role }]);
    setAgentCount((prev) => Math.min(50, prev + 1));
  };

  const applyPreset = (presetId: string) => {
    const preset = agentPresets.find((p) => p.id === presetId);
    if (preset) {
      setAgents((prev) => [...prev, { name: preset.name, role: preset.role }]);
      setAgentCount((prev) => Math.min(50, prev + 1));
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = scenarioTemplates.find((t) => t.id === templateId);
    if (template) {
      setTopic(template.topic);
      setSeedMaterial(template.seedMaterial);
      setAgents(template.agents);
      setAgentCount(template.agents.length);
      setRounds(template.rounds);
      setShowTemplates(false);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setAnalysis(null);

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

  const handleAnalyze = async (ingestToNotes: boolean = false) => {
    if (!result?.simulationId) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/wanxiang/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulationId: result.simulationId, ingestToNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data.analysis);
      if (ingestToNotes && data.noteResult) {
        alert(`已归纳到笔记：${data.noteResult.created ? "新建" : "更新"}笔记`);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "分析失败");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExport = () => {
    if (!analysis) return;
    const report = [
      `# 万象推演报告`,
      ``,
      `**主题**: ${topic}`,
      `**时间**: ${new Date().toLocaleString("zh-CN")}`,
      `**置信度**: ${analysis.confidence === "high" ? "高" : analysis.confidence === "medium" ? "中" : "低"}`,
      ``,
      `## 结论`,
      analysis.summary,
      ``,
      analysis.consensus.length > 0 ? `## 共识\n${analysis.consensus.map((c) => `- ${c}`).join("\n")}\n` : "",
      analysis.disagreements.length > 0 ? `## 分歧\n${analysis.disagreements.map((d) => `- ${d}`).join("\n")}\n` : "",
      analysis.risks.length > 0 ? `## 风险\n${analysis.risks.map((r) => `- ⚠️ ${r}`).join("\n")}\n` : "",
      analysis.opportunities.length > 0 ? `## 机会\n${analysis.opportunities.map((o) => `- ✅ ${o}`).join("\n")}\n` : "",
      analysis.actionItems.length > 0 ? `## 行动建议\n${analysis.actionItems.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n` : "",
    ].filter(Boolean).join("\n");

    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `万象推演-${topic.slice(0, 20)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteHistory = async (id: string) => {
    await fetch(`/api/wanxiang/history?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const presetsByCategory = getPresetsByCategory();

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-wide flex items-center gap-3">
          <Network size={28} className="text-[var(--nebula)]" />
          万象推演
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          多智能体 AI 预测引擎 — 构建平行数字世界，推演未来走向
        </p>
      </div>

      {/* Scenario Templates */}
      <div className="space-card rounded-2xl p-5">
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center gap-2 text-sm font-medium text-[var(--nebula)] hover:text-[var(--cyan)] transition-colors"
        >
          <Bookmark size={14} />
          场景模板
          {showTemplates ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showTemplates && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
            {scenarioTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t.id)}
                className="p-3 rounded-xl border border-card-border hover:border-[var(--nebula)] hover:bg-[var(--accent)] text-left transition-all"
              >
                <p className="text-xs font-bold mb-1">{t.name}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-2">{t.description}</p>
                <p className="text-[9px] text-[var(--nebula)] mt-1">{t.agents.length} 智能体 · {t.rounds} 轮</p>
              </button>
            ))}
          </div>
        )}
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
                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--nebula)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                种子材料（可选）
                <ImportButton type="seed" accept=".txt,.md,.json" variant="text" label="从文件导入" onSeedContent={(content) => setSeedMaterial(content)} />
              </label>
              <textarea
                value={seedMaterial}
                onChange={(e) => setSeedMaterial(e.target.value)}
                rows={4}
                placeholder="粘贴背景资料、数据、文章等作为智能体的初始知识…"
                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--nebula)] transition-colors resize-none"
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
                  onChange={(e) => {
                    const newCount = +e.target.value;
                    setAgentCount(newCount);
                    setAgents((prev) => {
                      if (newCount > prev.length) {
                        const extra = agentPresets.slice(prev.length, newCount).map((p) => ({ name: p.name, role: p.role }));
                        return [...prev, ...extra];
                      }
                      return prev.slice(0, newCount);
                    });
                  }}
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
                <div className="mt-3 space-y-3 max-h-80 overflow-y-auto p-3 rounded-xl bg-[var(--background)] border border-card-border">
                  {/* Preset selector */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {Object.entries(presetsByCategory).map(([cat, presets]) => (
                      <div key={cat} className="flex items-center gap-1">
                        <span className="text-[9px] text-muted-foreground">{categoryLabels[cat]}:</span>
                        {presets.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => applyPreset(p.id)}
                            className="px-1.5 py-0.5 rounded text-[9px] bg-[var(--accent)] text-muted-foreground hover:text-[var(--nebula)] hover:bg-[var(--nebula)]/10 transition-colors"
                            title={p.role}
                          >
                            +{p.name}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Agent list */}
                  {agents.map((agent, i) => (
                    <div key={i} className="flex items-center gap-2 group">
                      <span className="text-[10px] text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                      <input
                        value={agent.name}
                        onChange={(e) => updateAgent(i, "name", e.target.value)}
                        className="flex-1 px-2 py-1 rounded bg-[var(--accent)] border border-card-border text-xs font-mono focus:outline-none focus:border-[var(--nebula)] transition-colors"
                        placeholder="名称"
                      />
                      <input
                        value={agent.role}
                        onChange={(e) => updateAgent(i, "role", e.target.value)}
                        className="flex-[2] px-2 py-1 rounded bg-[var(--accent)] border border-card-border text-xs focus:outline-none focus:border-[var(--nebula)] transition-colors"
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
          {/* Result */}
          {result && <WanxiangResult data={result} />}

          {/* Analysis actions */}
          {result && (
            <div className="space-card rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-[var(--nebula)] mb-2">深度分析</h3>
              <button
                type="button"
                onClick={() => handleAnalyze(false)}
                disabled={analyzing}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--nebula)]/10 text-[var(--nebula)] hover:bg-[var(--nebula)]/20 transition-colors disabled:opacity-50"
              >
                {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
                {analyzing ? "分析中…" : "AI 深度分析"}
              </button>
              <button
                type="button"
                onClick={() => handleAnalyze(true)}
                disabled={analyzing}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--cyan)]/10 text-[var(--cyan)] hover:bg-[var(--cyan)]/20 transition-colors disabled:opacity-50"
              >
                <Bookmark size={12} />
                分析并归纳到笔记
              </button>
              {analysis && (
                <button
                  type="button"
                  onClick={handleExport}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--accent)] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Download size={12} />
                  导出报告
                </button>
              )}
            </div>
          )}

          {/* Analysis result */}
          {analysis && (
            <div className="space-card rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-[var(--nebula)]">分析结果</h3>
              <p className="text-sm">{analysis.summary}</p>
              {analysis.consensus.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-emerald-400 mb-1">共识</p>
                  {analysis.consensus.map((c, i) => <p key={i} className="text-xs text-muted-foreground">• {c}</p>)}
                </div>
              )}
              {analysis.risks.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-red-400 mb-1">风险</p>
                  {analysis.risks.map((r, i) => <p key={i} className="text-xs text-muted-foreground">⚠️ {r}</p>)}
                </div>
              )}
              {analysis.opportunities.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-emerald-400 mb-1">机会</p>
                  {analysis.opportunities.map((o, i) => <p key={i} className="text-xs text-muted-foreground">✅ {o}</p>)}
                </div>
              )}
              {analysis.actionItems.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-[var(--cyan)] mb-1">行动建议</p>
                  {analysis.actionItems.map((a, i) => <p key={i} className="text-xs text-muted-foreground">{i + 1}. {a}</p>)}
                </div>
              )}
            </div>
          )}

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
          <p className="text-xs text-muted-foreground text-center py-8">还没有推演记录</p>
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
                    className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {expandedHistory === h.id && h.result && (
                  <div className="px-3 pb-3 pt-1 border-t border-card-border">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {h.result}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
