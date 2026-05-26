"use client";

import Link from "next/link";
import { Crown, Lock } from "lucide-react";

interface MembershipBadgeProps {
  tier: "free" | "pro";
  membershipId?: string | null;
  compact?: boolean;
}

export function MembershipBadge({ tier, membershipId, compact }: MembershipBadgeProps) {
  if (tier === "pro") {
    return (
      <div className={`flex items-center gap-1.5 ${compact ? "" : "px-2.5 py-1.5 rounded-lg bg-[var(--star)]/10 border border-[var(--star)]/20"}`}>
        <Crown size={compact ? 10 : 12} className="text-[var(--star)]" />
        <span className={`font-bold text-[var(--star)] ${compact ? "text-[9px]" : "text-[11px]"}`}>
          PRO
        </span>
        {membershipId && !compact && (
          <span className="text-[9px] text-muted-foreground ml-1">{membershipId}</span>
        )}
      </div>
    );
  }

  return (
    <Link href="/workspace/settings#membership" className={`flex items-center gap-1.5 ${compact ? "" : "px-2.5 py-1.5 rounded-lg bg-[var(--accent)] border border-card-border hover:border-[var(--star)] transition-colors"}`}>
      <span className={`text-muted-foreground ${compact ? "text-[9px]" : "text-[11px]"}`}>
        免费版
      </span>
      {!compact && <Crown size={10} className="text-muted-foreground/50" />}
    </Link>
  );
}

export function UpgradePrompt({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--star)]/10 flex items-center justify-center mb-4">
        <Lock size={24} className="text-[var(--star)]" />
      </div>
      <h3 className="font-mono text-base font-bold mb-2">Pro 会员功能</h3>
      <p className="text-sm text-muted-foreground mb-4">{feature}需要 Pro 会员才能使用</p>
      <Link
        href="/workspace/settings#membership"
        className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--star)]/15 text-[var(--star)] hover:bg-[var(--star)] hover:text-[#0a0e17] transition-all"
      >
        升级 Pro
      </Link>
    </div>
  );
}
