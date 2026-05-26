import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

type AuthenticatedHandler = (
  req: Request,
  ctx: { userId: string; params?: Record<string, string> }
) => Promise<Response>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: Request, ctx?: { params?: Promise<Record<string, string>> }) => {
    let session;
    try {
      session = await auth();
    } catch {
      return NextResponse.json({ error: "认证失败" }, { status: 500 });
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const params = ctx?.params ? await ctx.params : undefined;
    return handler(req, { userId: session.user.id, params });
  };
}
