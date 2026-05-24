import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import StudioShell from "./StudioShell";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudioPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projectId = (await params).id;

  const project = await prisma.videoProject.findUnique({
    where: { id: projectId },
    include: { clips: { orderBy: { order: "asc" } } },
  });

  if (!project || project.userId !== session.user.id) {
    redirect("/workspace/photon");
  }

  const serialized = {
    id: project.id,
    title: project.title,
    topic: project.topic,
    platform: project.platform,
    style: project.style,
    script: project.script,
    status: project.status,
    bgmPath: project.bgmPath,
    outputUrl: project.outputUrl,
    clips: project.clips.map((c) => ({
      id: c.id,
      order: c.order,
      scriptText: c.scriptText,
      visualPrompt: c.visualPrompt,
      duration: c.duration,
      clipUrl: c.clipUrl,
      voiceUrl: c.voiceUrl,
      status: c.status,
    })),
  };

  return <StudioShell project={serialized} />;
}
