import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGraphData } from "@/lib/notes";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GraphView from "./GraphView";

export default async function NoteGraphPage() {
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

  let graphData;
  try {
    graphData = await getGraphData(session.user.id);
  } catch {
    graphData = { nodes: [], edges: [] };
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link
          href="/workspace/notes"
          className="p-2 rounded-lg border border-card-border text-muted-foreground hover:text-foreground hover:border-[var(--cyan)] transition-all"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-wide">知识图谱</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {graphData.nodes.length} 节点 · {graphData.edges.length} 链接
          </p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <GraphView data={graphData} />
      </div>
    </div>
  );
}
