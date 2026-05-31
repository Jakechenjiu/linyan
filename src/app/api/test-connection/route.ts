import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, { ok: boolean; status?: number; error?: string }> = {};

  // Test DeepSeek
  try {
    const res = await fetch("https://api.deepseek.com/v1/models", {
      headers: { Authorization: "Bearer test" },
      signal: AbortSignal.timeout(10000),
    });
    results.deepseek = { ok: res.ok || res.status === 401, status: res.status };
  } catch (e) {
    results.deepseek = { ok: false, error: e instanceof Error ? e.message : "连接失败" };
  }

  // Test MiMo
  try {
    const res = await fetch("https://token-plan-cn.xiaomimimo.com/anthropic/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "test",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: "mimo-v2.5-pro", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
      signal: AbortSignal.timeout(10000),
    });
    results.mimo = { ok: res.ok || res.status === 401, status: res.status };
  } catch (e) {
    results.mimo = { ok: false, error: e instanceof Error ? e.message : "连接失败" };
  }

  return NextResponse.json(results);
}
