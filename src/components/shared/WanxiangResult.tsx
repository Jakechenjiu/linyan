"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Users, MessageCircle, Lightbulb } from "lucide-react";

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
  if (!data) return null;

  const renderContent = (text: string) => (
    <p className="leading-relaxed whitespace-pre-wrap">{text}</p>
  );

  return (
    <div className="space-card rounded-2xl p-5 border-[var(--nebula)]/20 animate-slide-up">
      <h3 className="font-mono text-sm font-bold mb-3 text-[var(--nebula)]">推演结果</h3>

      <div className="divide-y divide-card-border">
        {data.summary && (
          <Section title="执行摘要" icon={<Lightbulb size={14} />}>
            {renderContent(data.summary)}
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
              <div key={i} className="py-2 space-y-1">
                <span className="text-[11px] font-medium text-[var(--cyan)]">第 {round.round || i + 1} 轮</span>
                {round.messages && Array.isArray(round.messages) && round.messages.map((msg: any, j: number) => (
                  <div key={j} className="flex gap-2 text-[11px]">
                    <span className="text-[var(--nebula)] shrink-0">{msg.agent || msg.role}:</span>
                    <span className="text-muted-foreground">{msg.content || msg.text}</span>
                  </div>
                ))}
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
