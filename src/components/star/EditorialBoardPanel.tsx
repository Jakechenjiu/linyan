"use client";

import { useState } from "react";
import { Users, Loader2, Check, X, AlertTriangle, MessageSquare } from "lucide-react";

interface Assessment {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  verdict: "approve" | "reject" | "conditional";
  reasoning: string;
}

interface EditorialResult {
  assessments: Record<string, Assessment>;
  debate: Array<{ speaker: string; point: string; type: string }>;
  votes: { approve: string[]; reject: string[]; conditional: string[] };
  finalDecision: "approve" | "reject" | "conditional";
  chiefRuling: string;
}

const REVIEWER_INFO: Record<string, { name: string; icon: string; color: string }> = {
  author: { name: "作者", icon: "✍️", color: "var(--cyan)" },
  editor: { name: "编辑", icon: "📝", color: "var(--star)" },
  chief: { name: "主编", icon: "👔", color: "var(--nebula)" },
  reader: { name: "读者代表", icon: "👤", color: "emerald" },
  continuity: { name: "连续性检查员", icon: "🔍", color: "orange" },
};

export default function EditorialBoardPanel({
  novelId,
  chapterId,
}: {
  novelId: string;
  chapterId: string | null;
}) {
  const [result, setResult] = useState<EditorialResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReviewer, setExpandedReviewer] = useState<string | null>(null);

  const handleReview = async () => {
    if (!chapterId) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/novels/${novelId}/editorial-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "评审失败");
      }

      const data = await res.json();
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "评审失败");
    } finally {
      setLoading(false);
    }
  };

  const verdictIcon = (verdict: string) => {
    switch (verdict) {
      case "approve": return <Check size={12} className="text-emerald-400" />;
      case "reject": return <X size={12} className="text-red-400" />;
      case "conditional": return <AlertTriangle size={12} className="text-[var(--star)]" />;
      default: return null;
    }
  };

  const verdictLabel = (verdict: string) => {
    switch (verdict) {
      case "approve": return "通过";
      case "reject": return "拒绝";
      case "conditional": return "需修改";
      default: return verdict;
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users size={12} className="text-[var(--nebula)]" />
          <span className="text-xs font-medium">编辑部评审</span>
        </div>
        <button
          onClick={handleReview}
          disabled={loading || !chapterId}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-[var(--nebula)]/10 text-[var(--nebula)] hover:bg-[var(--nebula)]/20 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={10} className="animate-spin" /> : <MessageSquare size={10} />}
          开始评审
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-[11px] text-red-400 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-2 py-6">
          <Loader2 size={20} className="animate-spin text-[var(--nebula)]" />
          <p className="text-[11px] text-muted-foreground">5 位评审者正在独立审阅...</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-3">
          {/* Final decision */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            result.finalDecision === "approve"
              ? "bg-emerald-500/10 border border-emerald-500/20"
              : result.finalDecision === "reject"
              ? "bg-red-500/10 border border-red-500/20"
              : "bg-[var(--star)]/10 border border-[var(--star)]/20"
          }`}>
            {verdictIcon(result.finalDecision)}
            <div className="flex-1">
              <p className="text-[11px] font-medium">{verdictLabel(result.finalDecision)}</p>
              <p className="text-[10px] text-muted-foreground">{result.chiefRuling}</p>
            </div>
          </div>

          {/* Reviewer cards */}
          <div className="space-y-1.5">
            {Object.entries(result.assessments).map(([role, assessment]) => {
              const info = REVIEWER_INFO[role];
              if (!info) return null;
              const isExpanded = expandedReviewer === role;

              return (
                <div key={role} className="rounded-lg border border-card-border overflow-hidden">
                  <button
                    onClick={() => setExpandedReviewer(isExpanded ? null : role)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--accent)] transition-colors"
                  >
                    <span className="text-sm">{info.icon}</span>
                    <span className="flex-1 text-left text-[11px] font-medium">{info.name}</span>
                    <span className={`text-[10px] font-mono ${
                      assessment.score >= 70 ? "text-emerald-400" :
                      assessment.score >= 50 ? "text-[var(--star)]" :
                      "text-red-400"
                    }`}>
                      {assessment.score}
                    </span>
                    {verdictIcon(assessment.verdict)}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-card-border space-y-2 pt-2">
                      {/* Strengths */}
                      {assessment.strengths.length > 0 && (
                        <div>
                          <p className="text-[9px] text-emerald-400 font-medium mb-0.5">亮点</p>
                          {assessment.strengths.map((s, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground">• {s}</p>
                          ))}
                        </div>
                      )}

                      {/* Weaknesses */}
                      {assessment.weaknesses.length > 0 && (
                        <div>
                          <p className="text-[9px] text-red-400 font-medium mb-0.5">问题</p>
                          {assessment.weaknesses.map((w, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground">• {w}</p>
                          ))}
                        </div>
                      )}

                      {/* Suggestions */}
                      {assessment.suggestions.length > 0 && (
                        <div>
                          <p className="text-[9px] text-[var(--cyan)] font-medium mb-0.5">建议</p>
                          {assessment.suggestions.map((s, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground">• {s}</p>
                          ))}
                        </div>
                      )}

                      {/* Reasoning */}
                      <p className="text-[10px] text-muted-foreground/70 italic">{assessment.reasoning}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Debate */}
          {result.debate.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground">辩论记录</p>
              {result.debate.map((entry, i) => {
                const info = REVIEWER_INFO[entry.speaker];
                return (
                  <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded bg-[var(--accent)]/50">
                    <span className="text-xs">{info?.icon || "💬"}</span>
                    <div className="flex-1">
                      <span className="text-[10px] font-medium">{info?.name || entry.speaker}</span>
                      <p className="text-[10px] text-muted-foreground">{entry.point}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <p className="text-[10px] text-muted-foreground text-center py-4">
          {chapterId ? "点击「开始评审」让 5 位专家审阅本章" : "请先选择一个章节"}
        </p>
      )}
    </div>
  );
}
