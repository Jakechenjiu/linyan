import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { userId: true, dailyWordTarget: true },
  });
  if (!novel || novel.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Today's log
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayLog = await prisma.writingLog.findUnique({
    where: { novelId_date: { novelId, date: today } },
  });

  // Week total
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekLogs = await prisma.writingLog.findMany({
    where: { novelId, date: { gte: weekStart } },
  });
  const weekWords = weekLogs.reduce((sum, l) => sum + l.wordCount, 0);

  // Streak: count consecutive days back from today (batch query)
  const maxStreakDays = 365;
  const streakStart = new Date(today);
  streakStart.setDate(streakStart.getDate() - maxStreakDays + 1);
  const streakLogs = await prisma.writingLog.findMany({
    where: { novelId, date: { gte: streakStart, lte: today }, wordCount: { gt: 0 } },
    select: { date: true },
    orderBy: { date: "desc" },
  });
  const streakDates = new Set(streakLogs.map((l) => l.date.toISOString().slice(0, 10)));
  let streak = 0;
  const checkDate = new Date(today);
  while (streakDates.has(checkDate.toISOString().slice(0, 10))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Daily logs for the past 30 days (for chart)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const recentLogs = await prisma.writingLog.findMany({
    where: { novelId, date: { gte: thirtyDaysAgo } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({
    dailyWordTarget: novel.dailyWordTarget,
    todayWords: todayLog?.wordCount || 0,
    weekWords,
    streak,
    recentLogs: recentLogs.map((l) => ({ date: l.date.toISOString().slice(0, 10), wordCount: l.wordCount })),
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const novelId = (await params).id;
  const { dailyWordTarget } = await req.json();

  if (typeof dailyWordTarget !== "number" || dailyWordTarget < 100) {
    return NextResponse.json({ error: "dailyWordTarget must be >= 100" }, { status: 400 });
  }

  await prisma.novel.updateMany({
    where: { id: novelId, userId: session.user.id },
    data: { dailyWordTarget },
  });

  return NextResponse.json({ ok: true });
}
