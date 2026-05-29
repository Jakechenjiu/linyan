import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { runSimulation } from "@/lib/wanxiang/engine";

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

  const body = await req.json().catch(() => null);
  if (!body?.topic) {
    return NextResponse.json({ error: "请提供推演主题" }, { status: 400 });
  }

  const agentCount = body.agentCount || 10;
  const rounds = body.rounds || 5;

  // Default agents if not provided
  const defaultAgents = [
    { name: "分析师", role: "冷静客观的数据分析师" },
    { name: "反对者", role: "持怀疑态度，善于发现风险" },
    { name: "乐观派", role: "关注机遇和可能性" },
    { name: "悲观派", role: "关注最坏情况和脆弱环节" },
    { name: "领域专家", role: "深厚专业知识的技术权威" },
    { name: "创新者", role: "善于提出颠覆性想法" },
    { name: "保守派", role: "倾向于维持现状" },
    { name: "用户体验设计师", role: "从用户视角思考" },
    { name: "市场专家", role: "了解市场动态和竞争格局" },
    { name: "战略顾问", role: "从全局视角分析问题" },
  ];

  const agents = (body.agents && Array.isArray(body.agents) && body.agents.length > 0)
    ? body.agents.map((a: { name: string; role: string }) => ({ name: a.name, role: a.role }))
    : defaultAgents.slice(0, agentCount);

  // Create simulation record
  let simulation;
  try {
    simulation = await prisma.simulation.create({
      data: {
        topic: body.topic,
        seedMaterial: body.seedMaterial || "",
        agentCount: agents.length,
        rounds,
        status: "running",
        userId: session.user.id,
      },
    });
  } catch (e) {
    console.error("Failed to create simulation record:", e);
  }

  try {
    // Run simulation using AI engine
    const result = await runSimulation(
      body.topic,
      body.seedMaterial || "",
      agents,
      rounds,
      session.user.id
    );

    // Mark simulation as completed
    if (simulation) {
      try {
        await prisma.simulation.update({
          where: { id: simulation.id },
          data: {
            status: "completed",
            result: JSON.stringify(result),
          },
        });
      } catch {}
    }

    return NextResponse.json({
      ...result,
      simulationId: simulation?.id,
    });
  } catch (e: unknown) {
    // Mark simulation as failed
    if (simulation) {
      try {
        await prisma.simulation.update({
          where: { id: simulation.id },
          data: {
            status: "failed",
            result: JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }),
          },
        });
      } catch {}
    }

    return NextResponse.json(
      { error: e instanceof Error ? e.message : "推演失败" },
      { status: 500 }
    );
  }
}
