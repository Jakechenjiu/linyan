"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveContent(formData: FormData) {
  let session;
  try {
    session = await auth();
  } catch {
    return;
  }
  if (!session?.user?.id) return;

  const contentId = formData.get("contentId") as string;
  const title = formData.get("title") as string;
  const body = formData.get("body") as string;
  const status = formData.get("status") as string;

  try {
    await prisma.content.updateMany({
      where: { id: contentId, userId: session.user.id },
      data: {
        title: title?.trim(),
        body,
        wordCount: body.trim().length,
        status,
        isPublic: status === "published",
      },
    });
  } catch (e) {
    console.error("saveContent failed:", e);
  }

  revalidatePath("/workspace/photon/editor/[id]");
}
