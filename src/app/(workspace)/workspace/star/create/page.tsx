import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChatWizard from "@/components/star/ChatWizard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CreateNovelPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="max-w-4xl">
      <Link
        href="/workspace/star"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors mb-6"
      >
        <ArrowLeft size={14} /> 返回
      </Link>

      <ChatWizard />
    </div>
  );
}
