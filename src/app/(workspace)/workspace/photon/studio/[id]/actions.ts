"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function verifyClipOwner(clipId: string, userId: string) {
  const clip = await prisma.videoClip.findUnique({
    where: { id: clipId },
    include: { project: { select: { userId: true } } },
  });
  if (!clip || clip.project.userId !== userId) {
    throw new Error("Unauthorized");
  }
  return clip;
}

export async function updateClip(clipId: string, data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user?.id) return;
  await verifyClipOwner(clipId, session.user.id);

  await prisma.videoClip.update({
    where: { id: clipId },
    data: {
      ...(data.scriptText !== undefined ? { scriptText: data.scriptText as string } : {}),
      ...(data.visualPrompt !== undefined ? { visualPrompt: data.visualPrompt as string } : {}),
      ...(data.duration !== undefined ? { duration: data.duration as number } : {}),
    },
  });
  revalidatePath("/workspace/photon/studio/[id]");
}

export async function reorderClips(orderData: { id: string; order: number }[]) {
  const session = await auth();
  if (!session?.user?.id) return;

  for (const item of orderData) {
    await prisma.videoClip.updateMany({
      where: { id: item.id, project: { userId: session.user.id } },
      data: { order: item.order },
    });
  }
  revalidatePath("/workspace/photon/studio/[id]");
}

export async function deleteClip(clipId: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  await verifyClipOwner(clipId, session.user.id);

  await prisma.videoClip.delete({ where: { id: clipId } });
  revalidatePath("/workspace/photon/studio/[id]");
}

export async function updateProject(projectId: string, data: { title?: string; bgmPath?: string | null; outputUrl?: string | null; status?: string }) {
  const session = await auth();
  if (!session?.user?.id) return;

  const project = await prisma.videoProject.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== session.user.id) return;

  await prisma.videoProject.update({ where: { id: projectId }, data });
  revalidatePath("/workspace/photon/studio/[id]");
}
