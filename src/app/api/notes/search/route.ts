import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 50);

  const where: Record<string, unknown> = { userId: session.user.id };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { body: { contains: q } },
      { tags: { contains: q } },
    ];
  }

  const notes = await prisma.note.findMany({
    where,
    select: { id: true, title: true, body: true, tags: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ notes });
}
