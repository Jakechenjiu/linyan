import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, genre, synopsis, targetWordCount, protagonist, antagonist, volumes, openingHook, worldTemplate, worldType, scale, powerSystem, geography, factions, rules } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const novel = await prisma.novel.create({
    data: {
      title: title.trim(),
      genre: genre || null,
      synopsis: synopsis || null,
      targetWordCount: targetWordCount || null,
      status: "planning",
      userId: session.user.id,
      // Create world setting if any world data provided
      worldSetting: (worldType || powerSystem || factions || rules)
        ? {
            create: {
              worldType: worldType || null,
              scale: scale || null,
              powerSystem: powerSystem || null,
              geography: geography || null,
              factions: factions || null,
              rules: rules || null,
            },
          }
        : undefined,
      // Create protagonist
      characters: protagonist?.name
        ? {
            create: [
              {
                name: protagonist.name,
                role: "protagonist",
                tagline: protagonist.tagline || null,
                desire: protagonist.desire || null,
                flaw: protagonist.flaw || null,
                goldenFinger: protagonist.goldenFinger || null,
                sortOrder: 0,
              },
              ...(antagonist?.name
                ? [{
                    name: antagonist.name,
                    role: "antagonist",
                    tagline: antagonist.tagline || null,
                    relationships: antagonist.conflict ? JSON.stringify({ conflict: antagonist.conflict, type: antagonist.role || "interest" }) : null,
                    sortOrder: 1,
                  }]
                : []),
            ],
          }
        : undefined,
      // Create outline volumes
      outlines: volumes?.length
        ? {
            create: volumes.map((v: { title: string; chapterCount: number; summary: string }, i: number) => ({
              title: v.title || `第${i + 1}卷`,
              type: "volume",
              summary: v.summary || null,
              sortOrder: i,
            })),
          }
        : undefined,
    },
    include: { worldSetting: true, characters: true, outlines: true },
  });

  // If there's an opening hook, create the first chapter
  if (openingHook?.trim()) {
    await prisma.chapter.create({
      data: {
        title: "第1章",
        body: openingHook.trim(),
        order: 1,
        wordCount: openingHook.trim().length,
        novelId: novel.id,
      },
    });
  }

  return NextResponse.json(novel, { status: 201 });
}
