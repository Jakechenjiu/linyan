import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import ContentEditor from "./ContentEditor";

export default async function ContentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const id = (await params).id;

  // Handle "new" - create a new content and redirect
  if (id === "new") {
    const content = await prisma.content.create({
      data: {
        title: "",
        body: "",
        platform: "wechat",
        userId: session.user.id,
      },
    });
    redirect(`/workspace/photon/editor/${content.id}`);
  }

  const content = await prisma.content.findUnique({ where: { id } });
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
