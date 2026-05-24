import { auth } from "@/lib/auth";
import { getAiConfig, callAiStream } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await getAiConfig(session.user.id);
  if (!config.hasKey) {
    return NextResponse.json(
      { error: "请先在设置中配置您的 AI API Key", code: "NO_API_KEY" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.data) {
    return NextResponse.json({ error: "Missing simulation data" }, { status: 400 });
  }

  const { data } = body;

  // Build a text representation of the simulation results
  const parts: string[] = [];
  if (data.topic) parts.push(`推演主题: ${data.topic}`);
  if (data.summary) parts.push(`执行摘要: ${data.summary}`);
  if (data.report) parts.push(`推演报告:\n${data.report}`);

  const system = `你是一位战略分析专家。请结合一份多智能体推演的结果，进行深度分析。

要求：
1. 识别 2-3 个关键转折点或洞察
2. 分析潜在风险因素
3. 给出 3 条可行的行动建议
4. 用中文输出，结构清晰
5. 使用 Markdown 格式的二级和三级标题组织内容`;

  const userMsg = parts.join("\n\n");

  const stream = callAiStream({
    ...config,
    system,
    messages: [{ role: "user", content: userMsg }],
    max_tokens: 2048,
    temperature: 0.6,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
