import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, Search, Tag, FileText, GitGraph, Crown, Lock } from "lucide-react";
import ImportButton from "@/components/shared/ImportButton";
import { checkMembership } from "@/lib/membership";

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ tag?: string; q?: string }> }) {
  let session;
  try {
    session = await auth();
  } catch {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">认证服务异常，请稍后重试</p>
      </div>
    );
  }
  if (!session?.user?.id) redirect("/login");

  // Check membership
  const membership = await checkMembership(session.user.id);
  if (!membership.isActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--star)]/10 flex items-center justify-center mb-4">
          <Lock size={28} className="text-[var(--star)]" />
        </div>
        <h2 className="font-mono text-xl font-bold mb-2">Pro 会员功能</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">灵思笔记需要 Pro 会员才能使用。输入会员码即可解锁全部功能。</p>
        <Link href="/workspace/settings#membership" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--star)]/15 text-[var(--star)] hover:bg-[var(--star)] hover:text-[#0a0e17] transition-all">
          <Crown size={16} /> 前往激活
        </Link>
      </div>
    );
  }

  const { tag, q } = await searchParams;

  let notes: { id: string; title: string; tags: string; updatedAt: Date; createdAt: Date }[] = [];
  try {
    notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        ...(tag ? { tags: { contains: tag } } : {}),
        ...(q ? { OR: [{ title: { contains: q } }, { body: { contains: q } }] } : {}),
      },
      select: { id: true, title: true, tags: true, updatedAt: true, createdAt: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">数据库查询失败，请稍后重试</p>
      </div>
    );
  }

  const allTags = new Set<string>();
  for (const n of notes) {
    try {
      const parsed = JSON.parse(n.tags || "[]");
      if (Array.isArray(parsed)) parsed.forEach((t: string) => allTags.add(t));
    } catch {}
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-wide">灵思笔记</h1>
          <p className="text-sm text-muted-foreground mt-1">知识管理与双向链接</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/workspace/notes/graph"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-card-border text-muted-foreground hover:text-foreground hover:border-[var(--cyan)] transition-all"
          >
            <GitGraph size={14} />
            知识图谱
          </Link>
          <ImportButton type="notes" accept=".md,.json" multiple />
          <Link
            href="/workspace/notes/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_16px_rgba(0,229,255,0.3)] transition-all"
            style={{ color: "#0a0e17" }}
          >
            <Plus size={14} />
            新建笔记
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <form className="flex items-center gap-3" method="GET">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="搜索笔记…"
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-xs bg-white/[0.04] border border-card-border hover:border-[var(--cyan)] transition-all"
        >
          搜索
        </button>
      </form>

      {/* Tag filters */}
      {allTags.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag size={12} className="text-muted-foreground" />
          {Array.from(allTags).map((t) => (
            <Link
              key={t}
              href={tag === t ? "/workspace/notes" : `/workspace/notes?tag=${encodeURIComponent(t)}`}
              className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                tag === t
                  ? "bg-[var(--cyan)] text-[#0a0e17]"
                  : "bg-[var(--cyan-soft)] text-[var(--cyan)] hover:bg-[var(--cyan)]/20"
              }`}
            >
              #{t}
            </Link>
          ))}
          {tag && (
            <Link href="/workspace/notes" className="text-[10px] text-muted-foreground hover:text-foreground">
              清除筛选
            </Link>
          )}
        </div>
      )}

      {/* Note list */}
      {notes.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <FileText size={40} className="mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">还没有笔记</p>
          <Link
            href="/workspace/notes/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-[var(--cyan)] hover:shadow-[0_0_16px_rgba(0,229,255,0.3)] transition-all"
            style={{ color: "#0a0e17" }}
          >
            <Plus size={14} />
            创建第一篇笔记
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => {
            const noteTags: string[] = (() => {
              try {
                const p = JSON.parse(note.tags || "[]");
                return Array.isArray(p) ? p : [];
              } catch {
                return [];
              }
            })();
            return (
              <div className="stagger-item" key={note.id}>
              <Link
                href={`/workspace/notes/${note.id}`}
                className="block p-4 rounded-xl border border-card-border bg-[var(--bg-elevated)]/50 hover:border-[var(--cyan)]/30 hover:bg-[var(--bg-elevated)] transition-all group"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-mono font-bold text-sm group-hover:text-[var(--cyan)] transition-colors truncate">
                    {note.title}
                  </h3>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(note.updatedAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                {noteTags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {noteTags.map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--cyan-soft)] text-[var(--cyan)]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
