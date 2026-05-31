import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider, apiKey, baseUrl, model } = await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: "请输入 API Key" }, { status: 400 });
  }

  // Determine format based on URL
  const isAnthropic = baseUrl?.includes("/anthropic") || provider === "anthropic";

  let testUrl: string;
  let headers: Record<string, string>;
  let body: Record<string, unknown>;

  if (isAnthropic) {
    testUrl = `${baseUrl}/v1/messages`;
    headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };
    body = {
      model: model || "claude-sonnet-4-6",
      max_tokens: 10,
      messages: [{ role: "user", content: "Say 'ok'" }],
    };
  } else {
    testUrl = `${baseUrl}/chat/completions`;
    headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    body = {
      model: model || "gpt-4o-mini",
      max_tokens: 10,
      messages: [{ role: "user", content: "Say 'ok'" }],
    };
  }

  try {
    const response = await fetch(testUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      const errMsg = response.status === 401 || response.status === 403
        ? "API Key 无效，请检查"
        : `API 返回 ${response.status}`;
      return NextResponse.json({ success: false, error: errMsg, detail: errText.slice(0, 200) });
    }

    return NextResponse.json({ success: true, message: "API Key 有效，连接成功" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "连接失败";
    return NextResponse.json({ success: false, error: msg });
  }
}
