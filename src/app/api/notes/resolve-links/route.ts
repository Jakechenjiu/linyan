import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ links: [] });

  const url = new URL(req.url);
  const titles = url.searchParams.getAll("titles");
  if (titles.length === 0)
    return NextResponse.json({ links: [] });

  const notes = await prisma.note.findMany({
    where: {
      userId: session.user.id,
      title: { in: titles },
    },
    select: { id: true, title: true },
  });

  return NextResponse.json({ links: notes });
}
