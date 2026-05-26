import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Video, FileText, ArrowRight, Clock, Sparkles } from "lucide-react";

export default async function PhotonPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [videoProjects, contents] = await Promise.all([
    prisma.videoProject.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { clips: true },
    }),
    prisma.content.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  const totalVideos = await prisma.videoProject.count({ where: { userId: session.user.id } });
  const totalContents = await prisma.content.count({ where: { userId: session.user.id } });

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-mono text-2xl font-bold tracking-wide">光子发布</h1>
        <p className="text-sm text-muted-foreground">AI 驱动的短视频与内容创作</p>
      </div>

      {/* Creation Entry */}
      <div className="space-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles size={16} className="text-[var(--cyan)]" />
          快速创作
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Video Creation */}
          <Link
            href="/workspace/photon/batch"
            className="group flex flex-col items-center gap-3 p-6 rounded-xl border border-card-border hover:border-[var(--cyan)] hover:bg-[var(--accent)] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--cyan)]/10 flex items-center justify-center group-hover:bg-[var(--cyan)]/20 transition-colors">
              <Video size={24} className="text-[var(--cyan)]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">AI 短视频</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">输入主题，自动生成分镜脚本和视频素材</p>
            </div>
            <ArrowRight size={16} className="text-muted-foreground group-hover:text-[var(--cyan)] transition-colors" />
          </Link>

          {/* Content Creation */}
          <Link
            href="/workspace/photon/editor/new"
            className="group flex flex-col items-center gap-3 p-6 rounded-xl border border-card-border hover:border-[var(--nebula)] hover:bg-[var(--accent)] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--nebula)]/10 flex items-center justify-center group-hover:bg-[var(--nebula)]/20 transition-colors">
              <FileText size={24} className="text-[var(--nebula)]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">图文内容</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">撰写公众号、小红书、知乎等平台文章</p>
            </div>
            <ArrowRight size={16} className="text-muted-foreground group-hover:text-[var(--nebula)] transition-colors" />
          </Link>
        </div>
      </div>

      {/* Recent Video Projects */}
      {videoProjects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Video size={14} className="text-[var(--cyan)]" /> 最近视频项目
            </h2>
            <span className="text-[10px] text-muted-foreground">{totalVideos} 个</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {videoProjects.map((proj) => {
              const doneCount = proj.clips.filter((c) => c.status === "done").length;
              const statusColor = proj.status === "done" ? "bg-emerald-400" : proj.status === "generating" ? "bg-amber-400 animate-pulse" : "bg-muted-foreground/30";
              return (
                <Link
                  key={proj.id}
                  href={`/workspace/photon/studio/${proj.id}`}
                  className="space-card rounded-xl p-3 hover:border-[var(--cyan)] transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                    <span className="text-xs font-medium truncate flex-1">{proj.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{proj.clips.length} 个分镜</span>
                    <span>{doneCount}/{proj.clips.length} 已生成</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                    <Clock size={10} />
                    {new Date(proj.updatedAt).toLocaleDateString("zh-CN")}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Contents */}
      {contents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <FileText size={14} className="text-[var(--nebula)]" /> 最近文章
            </h2>
            <span className="text-[10px] text-muted-foreground">{totalContents} 篇</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {contents.map((content) => {
              const platformLabels: Record<string, string> = {
                wechat: "公众号", xiaohongshu: "小红书", douyin: "抖音",
                weibo: "微博", zhihu: "知乎", bilibili: "B站",
              };
              return (
                <Link
                  key={content.id}
                  href={`/workspace/photon/editor/${content.id}`}
                  className="space-card rounded-xl p-3 hover:border-[var(--nebula)] transition-all"
                >
                  <p className="text-xs font-medium truncate mb-1">{content.title || "无标题"}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{platformLabels[content.platform] || content.platform}</span>
                    <span>{content.wordCount} 字</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                      content.status === "published" ? "bg-emerald-500/20 text-emerald-400" : "bg-muted-foreground/20 text-muted-foreground"
                    }`}>
                      {content.status === "published" ? "已发布" : "草稿"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {videoProjects.length === 0 && contents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          还没有创作内容，使用上方入口开始吧
        </div>
      )}
    </div>
  );
}
