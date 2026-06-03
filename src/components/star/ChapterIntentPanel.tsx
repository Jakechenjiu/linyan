"use client";

import { Target, Shield, AlertTriangle, ArrowRight } from "lucide-react";

interface ChapterIntent {
  goal: string;
  mustKeep: string[];
  mustAvoid: string[];
  endState: string;
  openingMandate?: string;
  characterFocus?: string;
}

export default function ChapterIntentPanel({
  intent,
}: {
  intent: ChapterIntent | null;
}) {
  if (!intent) {
    return (
      <div className="text-center py-4">
        <Target size={16} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-[10px] text-muted-foreground">
          生成章节后显示意图
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Goal */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <Target size={10} className="text-[var(--star)]" />
          <span className="text-[10px] font-medium text-[var(--star)]">
            本章目标
          </span>
        </div>
        <p className="text-[11px] text-foreground pl-4">{intent.goal}</p>
      </div>

      {/* Opening Mandate */}
      {intent.openingMandate && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <ArrowRight size={10} className="text-[var(--cyan)]" />
            <span className="text-[10px] font-medium text-[var(--cyan)]">
              开场状态
            </span>
          </div>
          <p className="text-[11px] text-foreground pl-4">
            {intent.openingMandate}
          </p>
        </div>
      )}

      {/* Character Focus */}
      {intent.characterFocus && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">👤</span>
            <span className="text-[10px] font-medium text-[var(--nebula)]">
              驱动角色
            </span>
          </div>
          <p className="text-[11px] text-foreground pl-4">
            {intent.characterFocus}
          </p>
        </div>
      )}

      {/* Must Keep */}
      {intent.mustKeep.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Shield size={10} className="text-emerald-400" />
            <span className="text-[10px] font-medium text-emerald-400">
              必须保留
            </span>
          </div>
          <ul className="space-y-0.5 pl-4">
            {intent.mustKeep.map((item, i) => (
              <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                <span className="text-emerald-400 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Must Avoid */}
      {intent.mustAvoid.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={10} className="text-red-400" />
            <span className="text-[10px] font-medium text-red-400">
              必须避免
            </span>
          </div>
          <ul className="space-y-0.5 pl-4">
            {intent.mustAvoid.map((item, i) => (
              <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                <span className="text-red-400 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* End State */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]">🎯</span>
          <span className="text-[10px] font-medium text-[var(--star)]">
            章尾变化
          </span>
        </div>
        <p className="text-[11px] text-foreground pl-4">{intent.endState}</p>
      </div>
    </div>
  );
}
