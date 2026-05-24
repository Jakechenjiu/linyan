"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function getSession() {
  try {
    return await auth();
  } catch {
    return null;
  }
}

async function verifyClipOwner(clipId: string, userId: string) {
  try {
    const clip = await prisma.videoClip.findUnique({
      where: { id: clipId },
      include: { project: { select: { userId: true } } },
    });
    if (!clip || clip.project.userId !== userId) {
      throw new Error("Unauthorized");
    }
    return clip;
  } catch {
    return null;
  }
}

export async function updateClip(clipId: string, data: Record<string, unknown>) {
  const session = await getSession();
  if (!session?.user?.id) return;
  const clip = await verifyClipOwner(clipId, session.user.id);
  if (!clip) return;

  try {
    await prisma.videoClip.update({
      where: { id: clipId },
      data: {
        ...(data.scriptText !== undefined ? { scriptText: data.scriptText as string } : {}),
        ...(data.visualPrompt !== undefined ? { visualPrompt: data.visualPrompt as string } : {}),
        ...(data.duration !== undefined ? { duration: data.duration as number } : {}),
      },
    });
  } catch (e) {
    console.error("updateClip failed:", e);
  }
  revalidatePath("/workspace/photon/studio/[id]");
}

export async function reorderClips(orderData: { id: string; order: number }[]) {
  const session = await getSession();
  if (!session?.user?.id) return;

  try {
    for (const item of orderData) {
      await prisma.videoClip.updateMany({
        where: { id: item.id, project: { userId: session.user.id } },
        data: { order: item.order },
      });
    }
  } catch (e) {
    console.error("reorderClips failed:", e);
  }
  revalidatePath("/workspace/photon/studio/[id]");
}

export async function deleteClip(clipId: string) {
  const session = await getSession();
  if (!session?.user?.id) return;
  const clip = await verifyClipOwner(clipId, session.user.id);
  if (!clip) return;

  try {
    await prisma.videoClip.delete({ where: { id: clipId } });
  } catch (e) {
    console.error("deleteClip failed:", e);
  }
  revalidatePath("/workspace/photon/studio/[id]");
}

export async function updateProject(projectId: string, data: { title?: string; bgmPath?: string | null; outputUrl?: string | null; status?: string }) {
  const session = await getSession();
  if (!session?.user?.id) return;

  try {
    const project = await prisma.videoProject.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== session.user.id) return;
    await prisma.videoProject.update({ where: { id: projectId }, data });
  } catch (e) {
    console.error("updateProject failed:", e);
  }
  revalidatePath("/workspace/photon/studio/[id]");
}
