import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getVideoProvider, detectAvailableProvider } from "@/lib/photon/video-providers";
import type { ProviderType } from "@/lib/photon/video-providers";
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

  let projectId: string, requestedClipIds: string[] | undefined, providerParam: string | undefined;
  try {
    const body = await req.json();
    projectId = body.projectId;
    requestedClipIds = body.clipIds;
    providerParam = body.provider;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  // Read user's DashScope key from DB (supports both env and user-level config)
  let userDashscopeKey: string | undefined;
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dashscopeApiKey: true },
    });
    userDashscopeKey = dbUser?.dashscopeApiKey?.trim() || undefined;
  } catch {
    // Non-critical; fall back to env
  }

  // Determine provider: explicit param > auto-detect > dashscope default
  let providerType: ProviderType = "dashscope";
  if (providerParam && ["dashscope", "kling", "zhipu", "pixelle"].includes(providerParam)) {
    providerType = providerParam as ProviderType;
  } else {
    providerType = await detectAvailableProvider({ apiKey: userDashscopeKey });
  }

  const videoProvider = getVideoProvider(providerType, { apiKey: userDashscopeKey });
  const available = await videoProvider.isAvailable();
  if (!available) {
    return NextResponse.json({
      error: `视频生成服务不可用 (${providerType})。请在设置页面配置对应的 API Key，或切换到其他视频模型。`,
    }, { status: 400 });
  }

  let project;
  try {
    project = await prisma.videoProject.findUnique({
      where: { id: projectId },
      include: { clips: { orderBy: { order: "asc" } } },
    });
  } catch {
    return NextResponse.json({ error: "数据库查询失败" }, { status: 500 });
  }

  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const clipsToProcess = requestedClipIds
    ? project.clips.filter((c) => requestedClipIds.includes(c.id))
    : project.clips.filter((c) => c.status === "pending" || c.status === "failed" || c.status === "generating");

  if (!clipsToProcess.length) {
    return NextResponse.json({ message: "No clips to process", results: [] });
  }

  // Mark clips as generating
  try {
    await prisma.videoClip.updateMany({
      where: { id: { in: clipsToProcess.map((c) => c.id) } },
      data: { status: "generating" },
    });

    await prisma.videoProject.update({
      where: { id: projectId },
      data: { status: "generating" },
    });
  } catch {
    return NextResponse.json({ error: "数据库更新失败" }, { status: 500 });
  }

  const results: { clipId: string; videoUrl?: string; voiceUrl?: string; error?: string }[] = [];

  for (const clip of clipsToProcess) {
    try {
      if (!clip.visualPrompt?.trim()) {
        throw new Error("画面描述 (visualPrompt) 为空，请先在分镜编辑中填写画面描述");
      }

      const videoTask = await videoProvider.generateVideo({
        prompt: clip.visualPrompt.trim(),
        duration: clip.duration,
        style: project.style || undefined,
      });
      const videoResult = await videoProvider.pollTask(videoTask.taskId);

      if (videoResult.status === "failed") {
        throw new Error(videoResult.error || "Video generation failed");
      }

      // Voice generation (may fail gracefully if provider doesn't support TTS)
      let voiceUrl: string | undefined;
      try {
        const voiceResult = await videoProvider.generateVoice(clip.scriptText);
        voiceUrl = voiceResult.voiceUrl;
      } catch (voiceErr) {
        console.warn(`Voice generation skipped for clip ${clip.id}:`, voiceErr);
      }

      await prisma.videoClip.update({
        where: { id: clip.id },
        data: {
          clipUrl: videoResult.videoUrl,
          voiceUrl: voiceUrl || null,
          status: "done",
        },
      });

      results.push({
        clipId: clip.id,
        videoUrl: videoResult.videoUrl,
        voiceUrl,
      });
    } catch (e) {
      await prisma.videoClip.update({
        where: { id: clip.id },
        data: { status: "failed" },
      });
      results.push({
        clipId: clip.id,
        error: e instanceof Error ? e.message : "未知错误",
      });
    }
  }

  const allDone = results.every((r) => !r.error);
  try {
    await prisma.videoProject.update({
      where: { id: projectId },
      data: { status: allDone ? "ready" : "partial" },
    });
  } catch {
    // Non-critical; results already generated
  }

  return NextResponse.json({ provider: providerType, results });
}
