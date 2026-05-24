import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "邮箱和密码（至少6位）为必填" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name: name || email.split("@")[0], email, password: hashed },
    });

    return NextResponse.json({ id: user.id, name: user.name, email: user.email });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}
