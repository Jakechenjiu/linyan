import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

const WANXIANG_URL = process.env.WANXIANG_URL || "http://localhost:5001";

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

  // Create simulation record
  let simulation;
  try {
    simulation = await prisma.simulation.create({
      data: {
        topic: body.topic,
        seedMaterial: body.seedMaterial || "",
        agentCount,
        rounds,
        status: "running",
        userId: session.user.id,
      },
    });
  } catch (e) {
    console.error("Failed to create simulation record:", e);
    // Non-fatal: continue without persistence
  }

  try {
    const payload: Record<string, unknown> = {
      topic: body.topic,
      seed_material: body.seedMaterial || "",
      agent_count: agentCount,
      rounds,
      platforms: body.platforms || ["twitter"],
    };

    // Include agent configs if provided
    if (body.agents && Array.isArray(body.agents) && body.agents.length > 0) {
      payload.agent_configs = body.agents.map((a: any) => ({
        name: a.name,
        role: a.role,
      }));
    }

    const res = await fetch(`${WANXIANG_URL}/simulation/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(300000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");

      // Mark simulation as failed
      if (simulation) {
        try {
          await prisma.simulation.update({
            where: { id: simulation.id },
            data: { status: "failed", result: JSON.stringify({ error: err }) },
          });
        } catch {}
      }

      return NextResponse.json({ error: `万象推演失败: ${err}` }, { status: 502 });
    }

    const data = await res.json();

    // Mark simulation as completed
    if (simulation) {
      try {
        await prisma.simulation.update({
          where: { id: simulation.id },
          data: {
            status: "completed",
            result: JSON.stringify(data),
          },
        });
      } catch {}
    }

    return NextResponse.json({ ...data, simulationId: simulation?.id });
  } catch (e: unknown) {
    // Mark simulation as failed
    if (simulation) {
      try {
        await prisma.simulation.update({
          where: { id: simulation.id },
          data: { status: "failed", result: JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }) },
        });
      } catch {}
    }

    if (e instanceof Error && e.name === "TimeoutError") {
      return NextResponse.json({ error: "推演超时，请减少智能体数量或轮次后重试" }, { status: 504 });
    }
    return NextResponse.json({ error: "万象推演服务未启动，请先启动 Docker 容器" }, { status: 503 });
  }
}
