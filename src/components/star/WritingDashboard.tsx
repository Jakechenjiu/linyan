"use client";

import { useState, useEffect, useCallback } from "react";
import { Target, Flame, TrendingUp, Pencil } from "lucide-react";

interface WritingStats {
  dailyWordTarget: number;
  todayWords: number;
  weekWords: number;
  streak: number;
  recentLogs: { date: string; wordCount: number }[];
}

export default function WritingDashboard({ novelId }: { novelId: string }) {
  const [stats, setStats] = useState<WritingStats | null>(null);
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState(1000);

  const fetchStats = useCallback(async () => {
    const res = await fetch(`/api/novels/${novelId}/writing-stats`);
    if (res.ok) {
      const data = await res.json();
      setStats(data);
      setTarget(data.dailyWordTarget);
    }
  }, [novelId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const saveTarget = async () => {
    await fetch(`/api/novels/${novelId}/writing-stats`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyWordTarget: target }),
    });
    setEditing(false);
    fetchStats();
  };

  if (!stats) return null;

  const pct = Math.min(100, Math.round((stats.todayWords / stats.dailyWordTarget) * 100));
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="space-card rounded-2xl p-5">
      <div className="flex items-center gap-4">
        {/* Progress ring */}
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle
              cx="40" cy="40" r="36" fill="none"
              stroke={pct >= 100 ? "var(--cyan)" : "var(--nebula)"}
              strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-foreground">{pct}%</span>
            <span className="text-[9px] text-muted-foreground">今日</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 grid grid-cols-3 gap-3">
          <div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
              <Target size={10} /> 目标
            </div>
            {editing ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="w-16 px-1.5 py-0.5 rounded bg-[var(--background)] border border-card-border text-xs focus:outline-none focus:border-[var(--cyan)]"
                  min={100} step={100}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") saveTarget(); if (e.key === "Escape") setEditing(false); }}
                />
                <button onClick={saveTarget} className="text-[10px] text-[var(--cyan)]">确定</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{stats.todayWords.toLocaleString()} / {stats.dailyWordTarget.toLocaleString()}</span>
                <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground">
                  <Pencil size={10} />
                </button>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
              <Flame size={10} /> 连续
            </div>
            <div className="text-sm font-bold">{stats.streak} <span className="text-[10px] font-normal text-muted-foreground">天</span></div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
              <TrendingUp size={10} /> 本周
            </div>
            <div className="text-sm font-bold">{stats.weekWords.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">字</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
