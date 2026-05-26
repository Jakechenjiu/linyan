"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Users, MessageCircle, Lightbulb, Download, Brain, Loader2 } from "lucide-react";

function Section({ title, icon, defaultOpen = true, children }: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-card-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left hover:bg-white/[0.01] transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-[var(--cyan)]">
          {icon}
          {title}
        </span>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>
      {open && <div className="pb-3 text-xs text-muted-foreground space-y-2">{children}</div>}
    </div>
  );
}

export default function WanxiangResult({ data }: { data: any }) {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  if (!data) return null;

  const handleExportMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# 万象推演报告\n`);
    if (data.summary) {
      lines.push(`## 执行摘要\n\n${data.summary}\n`);
    }
    if (data.report) {
      lines.push(`## 推演报告\n\n${data.report}\n`);
    }
    if (data.rounds && Array.isArray(data.rounds)) {
      lines.push(`## 互动轮次\n`);
      data.rounds.forEach((round: any) => {
        lines.push(`### 第 ${round.round} 轮\n`);
        if (round.messages && Array.isArray(round.messages)) {
          round.messages.forEach((msg: any) => {
            lines.push(`**${msg.agent || msg.role}**：${msg.content || msg.text}\n`);
          });
        }
      });
    }
    if (data.agents && Array.isArray(data.agents)) {
      lines.push(`## 参与智能体\n`);
      data.agents.forEach((agent: any) => {
        lines.push(`- ${agent.name} (${agent.role || "未指定角色"})\n`);
      });
    }
    if (aiAnalysis) {
      lines.push(`## AI 深度分析\n\n${aiAnalysis}\n`);
    }

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `万象推演-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAiAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisError("");
    try {
      const res = await fetch("/api/wanxiang/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "分析失败" }));
        throw new Error(err.error || "分析失败");
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let result = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk.startsWith("[ERROR]")) throw new Error(chunk.slice(7));
        result += chunk;
        setAiAnalysis(result);
      }
    } catch (e: unknown) {
      setAnalysisError((e instanceof Error ? e.message : null) || "分析失败");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-card rounded-2xl p-5 border-[var(--nebula)]/20 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-sm font-bold text-[var(--nebula)]">推演结果</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAiAnalysis}
            disabled={analyzing || !!aiAnalysis}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] border border-[var(--nebula)]/20 text-[var(--nebula)] hover:bg-[var(--nebula)]/10 transition-colors disabled:opacity-40"
          >
            {analyzing ? <Loader2 size={10} className="animate-spin" /> : <Brain size={10} />}
            {aiAnalysis ? "已分析" : "AI 深度分析"}
          </button>
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] border border-card-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download size={10} />
            导出
          </button>
        </div>
      </div>

      {analysisError && (
        <div className="p-2 rounded bg-red-500/5 border border-red-500/20 text-[10px] text-red-400 mb-3">
          {analysisError}
        </div>
      )}

      {/* AI Analysis section */}
      {aiAnalysis && (
        <Section title="AI 深度分析" icon={<Brain size={14} />} defaultOpen={true}>
          <div className="whitespace-pre-wrap leading-relaxed">{aiAnalysis}</div>
        </Section>
      )}

      <div className="divide-y divide-card-border">
        {data.summary && (
          <Section title="执行摘要" icon={<Lightbulb size={14} />}>
            <p className="leading-relaxed whitespace-pre-wrap">{data.summary}</p>
          </Section>
        )}

        {data.report && (
          <Section title="推演报告" icon={<FileText size={14} />}>
            {data.report.split("\n").map((line: string, i: number) => {
              if (line.startsWith("## ")) {
                return <h4 key={i} className="text-sm font-bold text-foreground mt-3 mb-1">{line.replace("## ", "")}</h4>;
              }
              if (line.startsWith("# ")) {
                return <h3 key={i} className="text-base font-bold text-[var(--cyan)] mt-4 mb-1">{line.replace("# ", "")}</h3>;
              }
              if (line.trim() === "") return <div key={i} className="h-2" />;
              return <p key={i} className="leading-relaxed">{line}</p>;
            })}
          </Section>
        )}

        {data.rounds && Array.isArray(data.rounds) && (
          <Section title={`互动轮次 (${data.rounds.length})`} icon={<MessageCircle size={14} />}>
            {data.rounds.map((round: any, i: number) => (
              <div key={i} className="space-y-2">
                <span className="text-[11px] font-medium text-[var(--cyan)] block border-b border-card-border pb-1 mb-2">
                  第 {round.round || i + 1} 轮
                </span>
                {round.messages && Array.isArray(round.messages) && round.messages.map((msg: any, j: number) => {
                  // Find agent color
                  const agent = data.agents?.find((a: any) => a.name === msg.agent || a.id === msg.agent);
                  const color = agent?.color || "var(--cyan)";
                  return (
                    <div key={j} className="flex gap-2 text-[11px] p-2 rounded-lg bg-[var(--bg-elevated)] border border-card-border">
                      <span
                        className="shrink-0 w-1.5 h-1.5 rounded-full mt-1"
                        style={{ background: color }}
                      />
                      <div className="min-w-0">
                        <span className="font-medium" style={{ color }}>
                          {msg.agent || msg.role}
                        </span>
                        <span className="text-muted-foreground ml-1">{msg.content || msg.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </Section>
        )}

        {data.agents && Array.isArray(data.agents) && (
          <Section title={`智能体 (${data.agents.length})`} icon={<Users size={14} />}>
            <div className="grid gap-2">
              {data.agents.map((agent: any, i: number) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-[var(--accent)]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: agent.color || "var(--cyan)" }} />
                  <span className="text-xs font-medium">{agent.name || agent.id}</span>
                  {agent.role && <span className="text-[10px] text-muted-foreground">({agent.role})</span>}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Raw JSON toggle */}
      <details className="mt-4 pt-3 border-t border-card-border">
        <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          查看原始响应
        </summary>
        <pre className="mt-2 text-[10px] text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto p-2 rounded bg-[var(--bg-elevated)]">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
