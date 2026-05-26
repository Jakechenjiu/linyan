import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { JianyingDraftBuilder } from "@/lib/photon/jianying";
import type { ClipInput } from "@/lib/photon/jianying";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import * as path from "path";
import * as fs from "fs/promises";

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname;
    // Block private/internal IPs
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.16.") || hostname.startsWith("172.17.") || hostname.startsWith("172.18.") ||
      hostname.startsWith("172.19.") || hostname.startsWith("172.20.") || hostname.startsWith("172.21.") ||
      hostname.startsWith("172.22.") || hostname.startsWith("172.23.") || hostname.startsWith("172.24.") ||
      hostname.startsWith("172.25.") || hostname.startsWith("172.26.") || hostname.startsWith("172.27.") ||
      hostname.startsWith("172.28.") || hostname.startsWith("172.29.") || hostname.startsWith("172.30.") ||
      hostname.startsWith("172.31.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("169.254.") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function getJianyingDraftDir(): string {
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || "C:/Users", "AppData", "Local");
  return path.join(localAppData, "JianyingPro", "User Data", "Projects", "com.lveditor.draft");
}

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

  const { projectId } = await req.json();
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
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

  const safeName = project.title.replace(/[<>:"/\\|?*]/g, "_").slice(0, 50) || "未命名视频";
  const draftDir = path.join(getJianyingDraftDir(), safeName);

  // Build clips input
  const clips: ClipInput[] = project.clips.map((c) => ({
    scriptText: c.scriptText,
    visualPrompt: c.visualPrompt,
    duration: c.duration,
    clipUrl: c.clipUrl,
    voiceUrl: c.voiceUrl,
  }));

  // Download remote assets to local resources folder
  const resourcesDir = path.join(draftDir, "resources");
  await fs.mkdir(resourcesDir, { recursive: true });

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];

    // Download video if remote
    if (clip.clipUrl && (clip.clipUrl.startsWith("http://") || clip.clipUrl.startsWith("https://"))) {
      if (!isSafeUrl(clip.clipUrl)) {
        clip.clipUrl = null;
        continue;
      }
      try {
        const res = await fetch(clip.clipUrl);
        if (res.ok) {
          const ext = ".mp4";
          const fileName = `clip_${i + 1}${ext}`;
          const buffer = Buffer.from(await res.arrayBuffer());
          await fs.writeFile(path.join(resourcesDir, fileName), buffer);
          clip.clipUrl = path.join(resourcesDir, fileName);
        }
      } catch (e) {
        console.warn(`Failed to download video for clip ${i}:`, e);
        clip.clipUrl = null;
      }
    }

    // Download voice if remote
    if (clip.voiceUrl && (clip.voiceUrl.startsWith("http://") || clip.voiceUrl.startsWith("https://"))) {
      if (!isSafeUrl(clip.voiceUrl)) {
        clip.voiceUrl = null;
        continue;
      }
      try {
        const res = await fetch(clip.voiceUrl);
        if (res.ok) {
          const ext = clip.voiceUrl.endsWith(".wav") ? ".wav" : ".mp3";
          const fileName = `voice_${i + 1}${ext}`;
          const buffer = Buffer.from(await res.arrayBuffer());
          await fs.writeFile(path.join(resourcesDir, fileName), buffer);
          clip.voiceUrl = path.join(resourcesDir, fileName);
        }
      } catch (e) {
        console.warn(`Failed to download voice for clip ${i}:`, e);
        clip.voiceUrl = null;
      }
    }
  }

  // Build draft
  const builder = new JianyingDraftBuilder(safeName + " (灵砚导出)");

  for (const clip of clips) {
    builder.addVideoClip(clip);
  }

  // Add audio and subtitle tracks
  builder.addAudioForClips(clips);
  builder.addSubtitlesForClips(clips);

  const { draftInfo, draftContent } = builder.build();

  // Write files
  await fs.writeFile(
    path.join(draftDir, "draft_info.json"),
    JSON.stringify(draftInfo, null, 2),
    "utf-8"
  );
  await fs.writeFile(
    path.join(draftDir, "draft_content.json"),
    JSON.stringify(draftContent, null, 2),
    "utf-8"
  );

  // Minimal draft_meta_info.json
  await fs.writeFile(
    path.join(draftDir, "draft_meta_info.json"),
    JSON.stringify({
      uuid: randomUUID(),
      created_at: new Date().toISOString(),
      version: "7.0.0",
    }, null, 2),
    "utf-8"
  );

  return NextResponse.json({
    draftPath: draftDir,
    clipCount: clips.length,
    hasVideo: clips.some((c) => c.clipUrl),
    hasVoice: clips.some((c) => c.voiceUrl),
    message: clips.some((c) => c.clipUrl)
      ? `已导出到剪映草稿目录: ${draftDir}`
      : "已导出脚本到剪映（无生成视频素材，请在剪映中手动添加画面）",
  });
}
