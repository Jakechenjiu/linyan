import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { redeemCode } from "@/lib/membership-code";

// Simple rate limiting per user
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const now = Date.now();
  const userAttempt = attempts.get(session.user.id);
  if (userAttempt) {
    if (now > userAttempt.resetAt) {
      attempts.set(session.user.id, { count: 1, resetAt: now + WINDOW_MS });
    } else if (userAttempt.count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "尝试次数过多，请15分钟后再试" },
        { status: 429 }
      );
    } else {
      userAttempt.count++;
    }
  } else {
    attempts.set(session.user.id, { count: 1, resetAt: now + WINDOW_MS });
  }

  const { code } = await req.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "请输入会员码" }, { status: 400 });
  }

  // Basic format validation
  const normalized = code.trim().toUpperCase();
  if (!normalized.startsWith("LYAN-") || normalized.length < 20) {
    return NextResponse.json({ error: "会员码格式不正确" }, { status: 400 });
  }

  const result = await redeemCode(code, session.user.id);

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: result.message,
    expiresAt: result.expiresAt,
  });
}
