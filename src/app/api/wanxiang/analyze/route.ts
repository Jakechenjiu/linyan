import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { analyzeSimulation, generateReport } from "@/lib/wanxiang/analysis";
import { ingestWanxiangToNotes } from "@/lib/notes/auto-ingest-wanxiang";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { simulationId, ingestToNotes } = await req.json();

  if (!simulationId) {
    return NextResponse.json({ error: "simulationId required" }, { status: 400 });
  }

  const simulation = await prisma.simulation.findUnique({
    where: { id: simulationId },
  });

  if (!simulation || simulation.userId !== session.user.id) {
    return NextResponse.json({ error: "推演记录不存在" }, { status: 404 });
  }

  if (!simulation.result) {
    return NextResponse.json({ error: "推演结果为空，无法分析" }, { status: 400 });
  }

  try {
    const analysis = await analyzeSimulation(
      simulation.topic,
      simulation.result,
      session.user.id
    );

    const report = generateReport(simulation.topic, simulation.result, analysis);

    let noteResult = null;
    if (ingestToNotes) {
      noteResult = await ingestWanxiangToNotes(
        simulation.topic,
        report,
        analysis,
        session.user.id
      );
    }

    return NextResponse.json({
      success: true,
      analysis,
      report,
      noteResult,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "分析失败" },
      { status: 500 }
    );
  }
}
