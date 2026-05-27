import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createCodes, getCodeStats, listCodes } from "@/lib/membership-code";

// Admin emails
const ADMIN_EMAILS = ["admin@lingyan.com"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin
  const { prisma } = await import("@/lib/db");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { count = 1, duration = null } = await req.json();

  // Validate
  if (count < 1 || count > 100) {
    return NextResponse.json({ error: "数量范围 1-100" }, { status: 400 });
  }

  const result = await createCodes(count, duration, session.user.id);

  return NextResponse.json({
    success: true,
    codes: result.codes, // Only returned once! Not stored in DB
    count: result.codes.length,
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prisma } = await import("@/lib/db");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [stats, codes] = await Promise.all([
    getCodeStats(),
    listCodes(100),
  ]);

  return NextResponse.json({ stats, codes });
}
