import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assembleVideo } from "@/lib/photon/pixelle";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, resolution } = await req.json();

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const project = await prisma.videoProject.findUnique({
    where: { id: projectId },
    include: { clips: { orderBy: { order: "asc" } } },
  });

  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const readyClips = project.clips.filter((c) => c.clipUrl && c.voiceUrl);

  if (!readyClips.length) {
    return NextResponse.json({ error: "No clips with video and voice ready" }, { status: 400 });
  }

  try {
    const result = await assembleVideo({
      clips: readyClips.map((c) => ({
        videoUrl: c.clipUrl!,
        voiceUrl: c.voiceUrl!,
        text: c.scriptText,
      })),
      bgmPath: project.bgmPath || undefined,
      resolution: resolution || "1080x1920",
    });

    await prisma.videoProject.update({
      where: { id: projectId },
      data: { outputUrl: result.outputUrl, status: "done" },
    });

    return NextResponse.json({ outputUrl: result.outputUrl });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : "视频合成失败",
    }, { status: 500 });
  }
}
