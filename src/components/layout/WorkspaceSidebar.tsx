"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard, Star, Zap, FlaskConical, ChevronDown,
  FileText, Plus, BarChart3, Layers, Calendar, TrendingUp,
  GitBranch, Sparkles, Settings, LogOut, BookOpen,
} from "lucide-react";

const modules = [
  {
    id: "star", label: "星图写作", icon: <Star size={16} />, color: "var(--cyan)",
    items: [
      { href: "/workspace/star", label: "我的长篇", icon: <BookOpen size={14} /> },
      { href: "/workspace/star", label: "新建章节", icon: <Plus size={14} /> },
      { href: "/workspace/star/analytics", label: "写作分析", icon: <BarChart3 size={14} /> },
    ],
  },
  {
    id: "photon", label: "光子发布", icon: <Zap size={16} />, color: "var(--nebula)",
    items: [
      { href: "/workspace/photon", label: "光子面板", icon: <Layers size={14} /> },
      { href: "/workspace/photon/templates", label: "模板工坊", icon: <FileText size={14} /> },
      { href: "/workspace/photon/batch", label: "批量生成", icon: <Sparkles size={14} /> },
      { href: "/workspace/photon/calendar", label: "内容日历", icon: <Calendar size={14} /> },
      { href: "/workspace/photon/analytics", label: "数据分析", icon: <TrendingUp size={14} /> },
    ],
  },
  {
    id: "lab", label: "灵感实验室", icon: <FlaskConical size={16} />, color: "var(--star)",
    items: [
      { href: "/workspace/lab", label: "灵感面板", icon: <FlaskConical size={14} /> },
      { href: "/workspace/lab", label: "思维脑图", icon: <GitBranch size={14} /> },
      { href: "/workspace/lab/story/create", label: "短篇生成", icon: <Sparkles size={14} /> },
    ],
  },
];

export default function WorkspaceSidebar({ user }: { user?: { name?: string | null; email?: string | null } }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["star", "photon", "lab"]));

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col border-r border-card-border bg-[var(--background)]">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-card-border">
        <Link href="/workspace" className="font-mono font-bold text-lg tracking-wider glow-text">
          灵砚
        </Link>
        <p className="text-[10px] text-muted-foreground mt-0.5">创作工作台</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Dashboard */}
        <Link
          href="/workspace"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
            pathname === "/workspace"
              ? "bg-[var(--cyan-soft)] text-[var(--cyan)] font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-[var(--accent)]"
          }`}
        >
          <LayoutDashboard size={16} />
          仪表盘
        </Link>

        <div className="my-3 border-t border-card-border" />

        {/* Module Sections */}
        {modules.map((mod) => (
          <div key={mod.id}>
            <button
              onClick={() => toggle(mod.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--accent)]"
              style={{ color: mod.color }}
            >
              {mod.icon}
              <span className="flex-1 text-left">{mod.label}</span>
              <ChevronDown
                size={12}
                className={`transition-transform ${expanded.has(mod.id) ? "rotate-0" : "-rotate-90"}`}
              />
            </button>
            {expanded.has(mod.id) && (
              <div className="ml-2 mt-0.5 space-y-0.5">
                {mod.items.map((item) => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                      pathname === item.href
                        ? "bg-[var(--cyan-soft)] text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-[var(--accent)]"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-card-border px-3 py-3 space-y-1">
        <Link
          href="/workspace/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-[var(--accent)] transition-all"
        >
          <Settings size={14} />设置
        </Link>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-6 h-6 rounded-full bg-[var(--cyan)] flex items-center justify-center text-[10px] font-bold" style={{ color: "#0a0e17" }}>
            {(user?.name ?? user?.email ?? "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{user?.name ?? "用户"}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-1 rounded hover:bg-[var(--accent)] text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
