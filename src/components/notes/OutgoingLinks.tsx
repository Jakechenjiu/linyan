"use client";

import { useState, useEffect } from "react";
import { parseWikilinks } from "@/lib/wikilinks";

interface OutgoingLink {
  id: string;
  title: string;
}

interface Props {
  body: string;
  currentTitle?: string;
}

export default function OutgoingLinks({ body, currentTitle }: Props) {
  const [links, setLinks] = useState<OutgoingLink[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const titles = parseWikilinks(body);
    if (titles.length === 0) {
      setLinks([]);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    titles.forEach((t) => params.append("titles", t));

    fetch(`/api/notes/resolve-links?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setLinks(data.links || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [body]);

  if (parseWikilinks(body).length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-card-border">
      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
        链接到的笔记 ({parseWikilinks(body).length})
        {loading && <span className="text-[10px]">加载中…</span>}
      </h4>
      <div className="space-y-1">
        {links.map((link) => (
          <a
            key={link.id}
            href={`/workspace/notes/${link.id}`}
            className="block text-xs text-[var(--cyan)] hover:underline"
          >
            {link.title}
          </a>
        ))}
        {!loading && links.length < parseWikilinks(body).length && (
          <p className="text-[10px] text-muted-foreground">
            {parseWikilinks(body).length - links.length} 个链接目标不存在
          </p>
        )}
      </div>
    </div>
  );
}
