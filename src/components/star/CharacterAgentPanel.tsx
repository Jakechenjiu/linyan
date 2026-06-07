"use client";

import { useState, useEffect } from "react";
import { Users, Loader2, RefreshCw, Brain, ChevronDown, ChevronRight } from "lucide-react";
import PersonalityRadar from "./PersonalityRadar";
import type { PersonalityVector } from "@/lib/character-agent/types";

interface AgentData {
  id: string;
  name: string;
  role: string;
  tagline?: string;
  personality: PersonalityVector | null;
  memoryCount: number;
  knowledgeCount: number;
  hasAgentData: boolean;
}

export default function CharacterAgentPanel({ novelId }: { novelId: string }) {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/novels/${novelId}/character-agent`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, [novelId]);

  const handleInitialize = async () => {
    setInitializing(true);
    try {
      const res = await fetch(`/api/novels/${novelId}/character-agent`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        await loadAgents();
      }
    } catch {
      // ignore
    } finally {
      setInitializing(false);
    }
  };

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      protagonist: "主角",
      antagonist: "反派",
      supporting: "配角",
      love_interest: "感情线",
      mentor: "导师",
    };
    return map[role] || role;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users size={12} className="text-[var(--cyan)]" />
          <span className="text-xs font-medium">角色 Agent</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={loadAgents}
            disabled={loading}
            className="p-1 rounded hover:bg-[var(--accent)] transition-colors"
            title="刷新"
          >
            <RefreshCw size={10} className={`text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleInitialize}
            disabled={initializing}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-[var(--cyan)] hover:bg-[var(--cyan)]/10 transition-colors disabled:opacity-50"
            title="为所有角色初始化 Agent 数据"
          >
            {initializing ? <Loader2 size={10} className="animate-spin" /> : <Brain size={10} />}
            初始化
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && agents.length === 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Agent list */}
      {agents.map((agent) => (
        <div key={agent.id} className="rounded-lg border border-card-border overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--accent)] transition-colors"
          >
            <span className="flex-1 text-left">
              <span className="text-[11px] font-medium">{agent.name}</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">
                {roleLabel(agent.role)}
              </span>
            </span>
            <span className="flex items-center gap-2 text-[9px] text-muted-foreground">
              {agent.hasAgentData ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              )}
              <span>{agent.memoryCount} 记忆</span>
              <span>{agent.knowledgeCount} 知识</span>
            </span>
            {expandedId === agent.id ? (
              <ChevronDown size={10} className="text-muted-foreground" />
            ) : (
              <ChevronRight size={10} className="text-muted-foreground" />
            )}
          </button>

          {/* Expanded content */}
          {expandedId === agent.id && (
            <div className="px-3 pb-3 border-t border-card-border">
              {agent.hasAgentData ? (
                <div className="flex items-start gap-3 pt-3">
                  {/* Radar chart */}
                  <PersonalityRadar personality={agent.personality} size={120} />

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {agent.tagline && (
                      <p className="text-[10px] text-muted-foreground">称号：{agent.tagline}</p>
                    )}
                    {agent.personality && (
                      <div className="text-[10px] text-muted-foreground space-y-0.5">
                        <p>开放性：{agent.personality.openness}/10</p>
                        <p>尽责性：{agent.personality.conscientiousness}/10</p>
                        <p>外向性：{agent.personality.extraversion}/10</p>
                        <p>宜人性：{agent.personality.agreeableness}/10</p>
                        <p>神经质：{agent.personality.neuroticism}/10</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground py-2">
                  未初始化。点击"初始化"按钮生成 Agent 数据。
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Empty state */}
      {!loading && agents.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-4">
          暂无角色。先在"角色"页面创建角色。
        </p>
      )}

      {/* 引导：未初始化的角色 */}
      {!loading && agents.length > 0 && agents.some((a) => !a.hasAgentData) && (
        <div className="rounded-lg border border-[var(--cyan)]/30 bg-[var(--cyan)]/5 p-3 space-y-2">
          <p className="text-[11px] text-foreground">
            有 {agents.filter((a) => !a.hasAgentData).length} 个角色未初始化 Agent
          </p>
          <p className="text-[10px] text-muted-foreground">
            角色 Agent 让每个角色有独立人格，写作时 AI 会参考角色性格。
          </p>
          <button
            onClick={handleInitialize}
            disabled={initializing}
            className="w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--cyan)] text-[#0a0e17] hover:opacity-90 transition-all disabled:opacity-50"
          >
            {initializing ? <Loader2 size={11} className="animate-spin" /> : <Brain size={11} />}
            一键初始化
          </button>
        </div>
      )}
    </div>
  );
}
