import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "请输入有效的邮箱地址" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 6 || password.length > 128) {
      return NextResponse.json({ error: "密码长度需在 6-128 位之间" }, { status: 400 });
    }
    if (name && (typeof name !== "string" || name.length > 50)) {
      return NextResponse.json({ error: "名称不能超过 50 个字符" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Return same message to prevent email enumeration
      return NextResponse.json({ id: existing.id, name: existing.name, email: existing.email });
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
