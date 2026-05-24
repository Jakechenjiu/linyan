import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CharacterGraph from "@/components/star/CharacterGraph";

export default async function GraphPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const novelId = (await params).id;
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { id: true, title: true, userId: true, characters: true },
  });
  if (!novel || novel.userId !== session.user.id) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href={`/workspace/star/${novel.id}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors">
          <ArrowLeft size={14} /> 返回工作室
        </Link>
      </div>
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-wide">角色关系图</h1>
        <p className="text-sm text-muted-foreground mt-1">{novel.title}</p>
      </div>
      <CharacterGraph novelId={novel.id} />
      <p className="text-xs text-muted-foreground">
        拖拽节点调整位置 · 悬停高亮关联 · 在「角色」页面编辑关系
      </p>
    </div>
  );
}
