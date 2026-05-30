import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Video, FileText, ArrowRight, Clock, Sparkles, Zap, Download, Eye } from "lucide-react";
import PhotonCreator from "./PhotonCreator";

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

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-mono text-2xl font-bold tracking-wide flex items-center justify-center gap-2">
          <Zap size={24} className="text-[var(--nebula)]" />
          光子发布
        </h1>
        <p className="text-sm text-muted-foreground">输入一句话，AI 帮你搞定视频和文章</p>
      </div>

      {/* Creator - one-click generation */}
      <PhotonCreator />

      {/* Recent Video Projects */}
      {videoProjects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Video size={14} className="text-[var(--cyan)]" /> 最近视频
            </h2>
            <Link href="/workspace/photon/batch" className="text-[10px] text-muted-foreground hover:text-[var(--cyan)]">
              查看全部
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
                    <span>{proj.clips.length} 分镜</span>
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
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
