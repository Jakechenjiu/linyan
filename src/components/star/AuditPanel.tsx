"use client";

import { useState } from "react";
import { Shield, Loader2, AlertTriangle, Check, ChevronDown, ChevronRight, Wand2 } from "lucide-react";

interface AuditIssue {
  line: string;
  text: string;
  problem: string;
  fix: string;
}

interface AuditResult {
  overallScore: number;
  dimensions: Record<string, number>;
  issues: AuditIssue[];
  summary: string;
}

const dimensionLabels: Record<string, string> = {
  significance_inflation: "意义膨胀",
  tricolon: "三段式排比",
  paragraph_arc: "段落弧度",
  ai_vocabulary: "AI词汇",
  vague_attribution: "模糊归因",
  dialogue_completeness: "对话完整性",
  concrete_anchors: "具体锚点",
  sentence_rhythm: "句式节奏",
  emotional_labeling: "情感标签",
  structural_regularity: "结构规律",
};

export default function AuditPanel({
  novelId,
  chapterId,
  onRewrite,
}: {
  novelId: string;
  chapterId: string;
  onRewrite: (issues: string) => void;
}) {
  const [auditing, setAuditing] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [showIssues, setShowIssues] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async () => {
    setAuditing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/novels/${novelId}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "审计失败");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "审计失败");
    } finally {
      setAuditing(false);
    }
  };

  const handleRewrite = () => {
    if (!result) return;
    const issuesText = result.issues
      .map((i) => `- ${i.problem}: "${i.text}" → ${i.fix}`)
      .join("\n");
    onRewrite(issuesText);
  };

  const getScoreColor = (score: number) => {
    if (score <= 3) return "text-emerald-400";
    if (score <= 6) return "text-[var(--star)]";
    return "text-red-400";
  };

  const getOverallColor = (score: number) => {
    if (score <= 30) return "text-emerald-400";
    if (score <= 60) return "text-[var(--star)]";
    return "text-red-400";
  };

  return (
    <div className="space-y-3">
      {/* Audit button */}
      <button
        onClick={handleAudit}
        disabled={auditing}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--accent)] border border-card-border text-muted-foreground hover:text-foreground hover:border-[var(--cyan)] transition-all disabled:opacity-50"
      >
        {auditing ? (
          <>
            <Loader2 size={12} className="animate-spin" /> 审计中…
          </>
        ) : (
          <>
            <Shield size={12} /> AI味审计
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="text-[11px] text-red-400 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-card rounded-xl p-4 space-y-3">
          {/* Overall score */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">AI味评分</p>
              <p className="text-[10px] text-muted-foreground">越低越好，0=纯人写</p>
            </div>
            <div className={`text-2xl font-mono font-bold ${getOverallColor(result.overallScore)}`}>
              {result.overallScore}
            </div>
          </div>

          {/* Summary */}
          <p className="text-[11px] text-muted-foreground">{result.summary}</p>

          {/* Dimensions */}
          <div className="space-y-1.5">
            {Object.entries(result.dimensions).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20 shrink-0">
                  {dimensionLabels[key] || key}
                </span>
                <div className="flex-1 h-1.5 bg-[var(--accent)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(value as number) * 10}%`,
                      background:
                        (value as number) <= 3
                          ? "var(--cyan)"
                          : (value as number) <= 6
                          ? "var(--star)"
                          : "#ef4444",
                    }}
                  />
                </div>
                <span className={`text-[10px] font-mono ${getScoreColor(value as number)}`}>
                  {value as number}
                </span>
              </div>
            ))}
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <div>
              <button
                onClick={() => setShowIssues(!showIssues)}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {showIssues ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                问题列表 ({result.issues.length})
              </button>
              {showIssues && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {result.issues.map((issue, i) => (
                    <div key={i} className="p-2 rounded-lg bg-[var(--background)] border border-card-border">
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertTriangle size={10} className="text-[var(--star)]" />
                        <span className="text-[10px] font-medium">{issue.problem}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-1">"{issue.text}"</p>
                      <p className="text-[10px] text-[var(--cyan)]">→ {issue.fix}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rewrite button */}
          <button
            onClick={handleRewrite}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[var(--nebula)]/10 text-[var(--nebula)] hover:bg-[var(--nebula)]/20 transition-colors"
          >
            <Wand2 size={12} /> 一键修复AI味
          </button>
        </div>
      )}
    </div>
  );
}
