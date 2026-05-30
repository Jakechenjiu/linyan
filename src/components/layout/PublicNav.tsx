"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { Menu, X } from "lucide-react";

export default function PublicNav({ hasSession = false }: { hasSession?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-10 liquid-glass border-b border-white/[0.04] rounded-none mx-0">
      <div className="flex items-center justify-between px-6 py-3.5 max-w-7xl mx-auto w-full">
        <Logo size="md" />
        <div className="hidden md:flex items-center gap-5">
          <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors">探索</Link>
          {hasSession ? (
            <Link href="/workspace" className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--cyan)]" style={{ color: "#0a0e17" }}>进入工作台</Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">登录</Link>
              <Link href="/register" className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--cyan)]" style={{ color: "#0a0e17" }}>免费注册</Link>
            </>
          )}
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-white/[0.05]">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden px-6 pb-4 space-y-3">
          <Link href="/explore" onClick={() => setMenuOpen(false)} className="block text-sm text-muted-foreground">探索</Link>
          {hasSession ? (
            <Link href="/workspace" onClick={() => setMenuOpen(false)} className="block text-center px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--cyan)]" style={{ color: "#0a0e17" }}>进入工作台</Link>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="block text-sm text-muted-foreground">登录</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="block text-center px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--cyan)]" style={{ color: "#0a0e17" }}>免费注册</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
