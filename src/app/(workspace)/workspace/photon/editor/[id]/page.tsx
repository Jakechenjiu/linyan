import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import ContentEditor from "./ContentEditor";

export default async function ContentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let session;
  try {
    session = await auth();
  } catch {
    redirect("/workspace/photon");
  }
  if (!session?.user?.id) redirect("/login");

  let content;
  try {
    content = await prisma.content.findUnique({ where: { id: (await params).id } });
  } catch {
    redirect("/workspace/photon?error=数据加载失败，请重试");
  }
  if (!content || content.userId !== session.user.id) notFound();

  return (
    <ContentEditor
      content={{
        id: content.id,
        title: content.title,
        body: content.body,
        platform: content.platform,
        wordCount: content.wordCount,
        status: content.status,
      }}
    />
  );
}
