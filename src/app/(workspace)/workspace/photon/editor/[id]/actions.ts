"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveContent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;

  const contentId = formData.get("contentId") as string;
  const title = formData.get("title") as string;
  const body = formData.get("body") as string;
  const status = formData.get("status") as string;

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

  revalidatePath("/workspace/photon/editor/[id]");
}
