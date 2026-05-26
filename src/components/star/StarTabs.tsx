"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Globe, Users, ListTree, GitGraph, BookMarked } from "lucide-react";

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

  const isActive = (href: string) => {
    if (href === "") return pathname === basePath;
    return pathname === `${basePath}${href}`;
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
    </div>
  );
}
