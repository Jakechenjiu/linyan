"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, Globe, Users, ListTree, GitGraph, BookMarked, Brain, Loader2, Download, FileText, Book } from "lucide-react";
import { toast } from "sonner";

const tabs = [
  { id: "chapters", label: "章节", icon: BookOpen, href: "" },
  { id: "settings", label: "设定", icon: Globe, href: "/settings" },
  { id: "characters", label: "角色", icon: Users, href: "/characters" },
  { id: "outline", label: "大纲", icon: ListTree, href: "/outline" },
  { id: "codex", label: "素材库", icon: BookMarked, href: "/codex" },
  { id: "graph", label: "关系图", icon: GitGraph, href: "/graph" },
];

export default function StarTabs({ novelId }: { novelId: string }) {
  const pathname = usePathname();
  const basePath = `/workspace/star/${novelId}`;
  const [ingesting, setIngesting] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const isActive = (href: string) => {
    if (href === "") return pathname === basePath;
    return pathname === `${basePath}${href}`;
  };

  const handleIngest = async () => {
    setIngesting(true);
    try {
      const res = await fetch("/api/notes/auto-ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "novel", id: novelId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || "归纳完成");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "归纳失败");
    } finally {
      setIngesting(false);
    }
  };

  const handleExport = async (format: "txt" | "epub") => {
    setExporting(format);
    try {
      const res = await fetch(`/api/novels/${novelId}/export?format=${format}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "导出失败");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `novel.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} 导出成功`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "导出失败");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={`${basePath}${tab.href}`}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isActive(tab.href)
              ? "bg-[var(--cyan)] text-[#0a0e17]"
              : "text-muted-foreground hover:text-foreground hover:bg-[var(--accent)]"
          }`}
        >
          <tab.icon size={13} /> {tab.label}
        </Link>
      ))}
      <button
        onClick={handleIngest}
        disabled={ingesting}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-[var(--nebula)] hover:bg-[var(--nebula)]/10 transition-colors disabled:opacity-50"
        title="将小说数据自动归纳到灵思笔记"
      >
        {ingesting ? <Loader2 size={11} className="animate-spin" /> : <Brain size={11} />}
        归纳笔记
      </button>

      {/* 导出按钮 */}
      <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-card-border">
        <button
          onClick={() => handleExport("txt")}
          disabled={exporting !== null}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
          title="导出 TXT"
        >
          {exporting === "txt" ? <Loader2 size={10} className="animate-spin" /> : <FileText size={10} />}
          TXT
        </button>
        <button
          onClick={() => handleExport("epub")}
          disabled={exporting !== null}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
          title="导出 EPUB"
        >
          {exporting === "epub" ? <Loader2 size={10} className="animate-spin" /> : <Book size={10} />}
          EPUB
        </button>
      </div>
    </div>
  );
}
