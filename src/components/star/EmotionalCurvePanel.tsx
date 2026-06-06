"use client";

import { useState } from "react";
import { TrendingUp, Loader2, Sparkles } from "lucide-react";
import type { EmotionalDataPoint } from "@/lib/emotional-curve/types";
import { EMOTIONAL_DIMENSIONS } from "@/lib/emotional-curve/dimensions";

const COLORS: Record<string, string> = {
  tension: "#ef4444",
  suspense: "#f59e0b",
  pleasure: "#10b981",
  sadness: "#6366f1",
  reversal: "#ec4899",
};

export default function EmotionalCurvePanel({ novelId }: { novelId: string }) {
  const [curve, setCurve] = useState<EmotionalDataPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/novels/${novelId}/emotional-curve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description || undefined,
          chapterNumber: 1,
          totalChapters: 100,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurve(data.design.targetCurve);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={12} className="text-[var(--star)]" />
          <span className="text-xs font-medium">情感曲线</span>
        </div>
      </div>

      {/* Description input */}
      <div className="space-y-1.5">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述本章的情感目标，如：开头紧张，中间有反转，结尾悲伤…"
          className="w-full px-2.5 py-2 rounded-lg bg-[var(--accent)] border border-card-border text-[11px] resize-none focus:outline-none focus:border-[var(--cyan)] transition-colors"
          rows={2}
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--accent)] border border-card-border text-muted-foreground hover:text-foreground hover:border-[var(--cyan)] transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
          生成曲线
        </button>
      </div>

      {/* Curve visualization */}
      {curve && curve.length > 0 && (
        <div className="space-y-3">
          {/* SVG Chart */}
          <div className="rounded-lg border border-card-border p-3">
            <svg viewBox="0 0 300 150" className="w-full">
              {/* Grid */}
              {[0, 25, 50, 75, 100].map((x) => (
                <line key={`v${x}`} x1={x * 3} y1={0} x2={x * 3} y2={150} stroke="var(--accent)" strokeWidth={0.5} />
              ))}
              {[0, 5, 10].map((y) => (
                <line key={`h${y}`} x1={0} y1={150 - y * 15} x2={300} y2={150 - y * 15} stroke="var(--accent)" strokeWidth={0.5} />
              ))}

              {/* Lines for each dimension */}
              {EMOTIONAL_DIMENSIONS.map((dim) => {
                const points = curve
                  .map((p) => {
                    const x = (p.position / 100) * 300;
                    const y = 150 - ((p as any)[dim.id] || 0) * 15;
                    return `${x},${y}`;
                  })
                  .join(" ");
                return (
                  <polyline
                    key={dim.id}
                    points={points}
                    fill="none"
                    stroke={COLORS[dim.id]}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}

              {/* Data points */}
              {curve.map((p, i) =>
                EMOTIONAL_DIMENSIONS.map((dim) => {
                  const x = (p.position / 100) * 300;
                  const y = 150 - ((p as any)[dim.id] || 0) * 15;
                  return (
                    <circle
                      key={`${dim.id}-${i}`}
                      cx={x}
                      cy={y}
                      r={3}
                      fill={COLORS[dim.id]}
                    />
                  );
                })
              )}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            {EMOTIONAL_DIMENSIONS.map((dim) => (
              <div key={dim.id} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[dim.id] }} />
                <span className="text-[9px] text-muted-foreground">{dim.name}</span>
              </div>
            ))}
          </div>

          {/* Data table */}
          <div className="text-[9px] text-muted-foreground">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">位置</th>
                  <th>紧张</th>
                  <th>悬念</th>
                  <th>愉悦</th>
                  <th>悲伤</th>
                  <th>反转</th>
                </tr>
              </thead>
              <tbody>
                {curve.map((p, i) => (
                  <tr key={i}>
                    <td className="text-left">{p.position}%</td>
                    <td className="text-center">{p.tension}</td>
                    <td className="text-center">{p.suspense}</td>
                    <td className="text-center">{p.pleasure}</td>
                    <td className="text-center">{p.sadness}</td>
                    <td className="text-center">{p.reversal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!curve && !loading && (
        <p className="text-[10px] text-muted-foreground text-center py-4">
          输入情感目标，或直接点击"生成曲线"获取默认曲线
        </p>
      )}
    </div>
  );
}
