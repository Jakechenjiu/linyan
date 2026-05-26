"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard, Star, Zap, ChevronDown,
  FileText, Plus, BarChart3, Layers,
  Settings, LogOut, BookOpen, Brain, GitGraph, Network, Sparkles,
} from "lucide-react";

const modules = [
  {
    id: "star", label: "星图写作", icon: <Star size={16} />, color: "var(--cyan)",
    items: [
      { href: "/workspace/star", label: "我的长篇", icon: <BookOpen size={14} /> },
      { href: "/workspace/star/create", label: "创建新书", icon: <Plus size={14} /> },
      { href: "/workspace/star/analytics", label: "写作分析", icon: <BarChart3 size={14} /> },
    ],
  },
  {
    id: "photon", label: "光子发布", icon: <Zap size={16} />, color: "var(--nebula)",
    items: [
      { href: "/workspace/photon", label: "创作面板", icon: <Layers size={14} /> },
      { href: "/workspace/photon/batch", label: "AI 短视频", icon: <Sparkles size={14} /> },
    ],
  },
  {
    id: "notes", label: "灵思笔记", icon: <Brain size={16} />, color: "var(--cyan)",
    items: [
      { href: "/workspace/notes", label: "所有笔记", icon: <FileText size={14} /> },
      { href: "/workspace/notes/new", label: "新建笔记", icon: <Plus size={14} /> },
      { href: "/workspace/notes/graph", label: "知识图谱", icon: <GitGraph size={14} /> },
    ],
  },
  {
    id: "wanxiang", label: "万象推演", icon: <Network size={16} />, color: "var(--nebula)",
    items: [
      { href: "/workspace/wanxiang", label: "推演面板", icon: <Network size={14} /> },
      { href: "/workspace/wanxiang", label: "历史推演", icon: <FileText size={14} /> },
      { href: "/workspace/notes", label: "从笔记推演", icon: <Brain size={14} /> },
    ],
  },
];

function isActive(pathname: string, href: string, items?: { href: string }[]) {
  if (pathname === href) return true;
  if (items?.some((child) => pathname.startsWith(child.href + "/"))) return true;
  return false;
}

export default function WorkspaceSidebar({ user }: { user?: { name?: string | null; email?: string | null } }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["notes", "star", "photon", "wanxiang"]));

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col liquid-glass !rounded-none !border-t-0 !border-l-0 !border-b-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/[0.04]">
        <Link
          href="/workspace"
          className="font-mono font-bold text-lg tracking-widest text-gradient-cyan glow-text hover:tracking-[0.15em] inline-block transition-all duration-300"
        >
          灵砚
        </Link>
        <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">创作工作台</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Dashboard */}
        <Link
          href="/workspace"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
            pathname === "/workspace"
              ? "bg-[var(--cyan-soft)] text-[var(--cyan)] font-medium shadow-[inset_0_0_0_1px_rgba(0,229,255,0.12)]"
              : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
          }`}
        >
          <LayoutDashboard size={16} />
          仪表盘
          {pathname === "/workspace" && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--cyan)] shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
          )}
        </Link>

        <div className="my-3 border-t border-white/[0.04]" />

        {/* Module Sections */}
        {modules.map((mod) => {
          const modActive = isActive(pathname, "/workspace/" + mod.id, mod.items);
          return (
            <div key={mod.id} className="space-y-0.5">
              <button
                onClick={() => toggle(mod.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/[0.04]"
                style={{ color: mod.color }}
              >
                {mod.icon}
                <span className="flex-1 text-left">{mod.label}</span>
                {modActive && (
                  <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,229,255,0.6)]" style={{ background: mod.color }} />
                )}
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-300 ${expanded.has(mod.id) ? "rotate-0" : "-rotate-90"}`}
                />
              </button>
              <div
                className={`ml-2 space-y-0.5 overflow-hidden transition-all duration-300 ${
                  expanded.has(mod.id) ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                {mod.items.map((item) => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-300 ${
                      pathname === item.href
                        ? "bg-[var(--cyan-soft)] text-foreground shadow-[inset_0_0_0_1px_rgba(0,229,255,0.10)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                    {pathname === item.href && (
                      <span className="ml-auto w-1 h-1 rounded-full bg-[var(--cyan)] shadow-[0_0_6px_rgba(0,229,255,0.5)]" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/[0.04] px-3 py-3 space-y-1">
        <Link
          href="/workspace/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
            pathname === "/workspace/settings"
              ? "bg-[var(--cyan-soft)] text-foreground shadow-[inset_0_0_0_1px_rgba(0,229,255,0.10)]"
              : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
          }`}
        >
          <Settings size={14} />设置
          {pathname === "/workspace/settings" && (
            <span className="ml-auto w-1 h-1 rounded-full bg-[var(--cyan)] shadow-[0_0_6px_rgba(0,229,255,0.5)]" />
          )}
        </Link>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--cyan)] to-[var(--nebula)] flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_12px_rgba(0,229,255,0.2)]">
            {(user?.name ?? user?.email ?? "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{user?.name ?? "用户"}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-1.5 rounded-lg hover:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
