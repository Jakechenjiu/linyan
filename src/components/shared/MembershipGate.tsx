"use client";

import Link from "next/link";
import { Crown, Lock } from "lucide-react";

export default function MembershipGate({
  feature,
  children,
}: {
  feature: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-[var(--star)]/10 flex items-center justify-center mb-4">
        <Lock size={28} className="text-[var(--star)]" />
      </div>
      <h2 className="font-mono text-xl font-bold mb-2">Pro 会员功能</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {feature}需要 Pro 会员才能使用。输入会员码即可解锁全部功能。
      </p>
      <Link
        href="/workspace/settings#membership"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--star)]/15 text-[var(--star)] hover:bg-[var(--star)] hover:text-[#0a0e17] transition-all"
      >
        <Crown size={16} /> 前往激活
      </Link>
    </div>
  );
}
