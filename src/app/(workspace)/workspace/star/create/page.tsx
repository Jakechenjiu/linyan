import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CreateWizard from "@/components/star/CreateWizard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CreateNovelPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link
          href="/workspace/star"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors"
        >
          <ArrowLeft size={14} /> 返回
        </Link>
        <div>
          <h1 className="font-mono text-3xl font-bold tracking-wide">创建新书</h1>
          <p className="text-sm text-muted-foreground mt-1">引导式创书向导 — 4步设置你的故事宇宙</p>
        </div>
      </div>

      <CreateWizard />
    </div>
  );
}
