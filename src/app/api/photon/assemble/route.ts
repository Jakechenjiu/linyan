import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assembleVideo } from "@/lib/photon/pixelle";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let session;
  try {
    session = await auth();
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, resolution } = await req.json();

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  let project;
  try {
    project = await prisma.videoProject.findUnique({
      where: { id: projectId },
      include: { clips: { orderBy: { order: "asc" } } },
    });
  } catch (e) {
    return NextResponse.json({ error: "数据库查询失败" }, { status: 500 });
  }

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

    try {
      await prisma.videoProject.update({
        where: { id: projectId },
        data: { outputUrl: result.outputUrl, status: "done" },
      });
    } catch (dbErr) {
      console.error("Failed to update project after assemble:", dbErr);
    }

    return NextResponse.json({ outputUrl: result.outputUrl });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : "未知错误",
    }, { status: 500 });
  }
}
