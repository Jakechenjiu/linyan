import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 速率限制 — LRU 存储，自动淘汰过期条目，防止内存膨胀
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 分钟
const RATE_LIMIT_MAX = 100; // 每窗口最大请求数
const RATE_LIMIT_MAX_SIZE = 10000; // 最多追踪 10000 个 IP

const rateLimit = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(key);

  if (!entry || now > entry.resetTime) {
    // 超过最大条目数时清理最老的
    if (rateLimit.size >= RATE_LIMIT_MAX_SIZE) {
      const firstKey = rateLimit.keys().next().value;
      if (firstKey !== undefined) rateLimit.delete(firstKey);
    }
    rateLimit.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// 定期清理过期条目（每 5 分钟）
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimit) {
    if (now > entry.resetTime) {
      rateLimit.delete(key);
    }
  }
}, 5 * 60_000);

// 生成 nonce（用于 CSP）
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // ===== Security Headers =====

  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  // Content Security Policy — nonce-based，比 unsafe-inline 更安全
  const nonce = generateNonce();
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`, // Next.js dev 需要 unsafe-eval，生产可移除
    "style-src 'self' 'unsafe-inline'", // Tailwind 需要 unsafe-inline
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.deepseek.com https://api.openai.com https://api.anthropic.com https://token-plan-cn.xiaomimimo.com https://dashscope.aliyuncs.com wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  res.headers.set("Content-Security-Policy", csp);

  // 将 nonce 传递给页面（可通过 headers 读取）
  res.headers.set("X-Nonce", nonce);

  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // ===== Rate Limiting for API routes =====
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const key = getRateLimitKey(req);
    if (isRateLimited(key)) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // ===== Block sensitive paths =====
  const pathname = req.nextUrl.pathname;
  const blockedPaths = ["/.env", "/.git", "/node_modules", "/prisma", "/.claude"];

  if (blockedPaths.some((p) => pathname.startsWith(p))) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
