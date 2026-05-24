import { auth } from "@/lib/auth";
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

  try {
    const res = await fetch(`${WANXIANG_URL}/simulation/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: body.topic,
        seed_material: body.seedMaterial || "",
        agent_count: body.agentCount || 10,
        rounds: body.rounds || 5,
        platforms: body.platforms || ["twitter"],
      }),
      signal: AbortSignal.timeout(300000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      return NextResponse.json({ error: `万象推演失败: ${err}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    if (e.name === "TimeoutError") {
      return NextResponse.json({ error: "推演超时，请减少智能体数量或轮次后重试" }, { status: 504 });
    }
    return NextResponse.json({ error: "万象推演服务未启动，请先启动 Docker 容器" }, { status: 503 });
  }
}
