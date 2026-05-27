import { createHash, randomBytes } from "crypto";
import { prisma } from "./db";

// Generate a secure random membership code
export function generateCode(): string {
  // Format: LYAN-XXXX-XXXX-XXXX-XXXX (20 hex chars = 80 bits of entropy)
  const bytes = randomBytes(16);
  const hex = bytes.toString("hex").toUpperCase();
  return `LYAN-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

// Hash a code for storage (SHA-256)
export function hashCode(code: string): string {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

// Verify a code against stored hash
export function verifyCode(code: string, hash: string): boolean {
  return hashCode(code) === hash;
}

// Create membership codes (admin function)
export async function createCodes(
  count: number,
  duration: number | null, // days, null = permanent
  createdBy: string
): Promise<{ codes: string[]; hashes: string[] }> {
  const codes: string[] = [];
  const hashes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = generateCode();
    const hash = hashCode(code);
    codes.push(code);
    hashes.push(hash);
  }

  // Batch insert all codes
  await prisma.membershipCode.createMany({
    data: hashes.map((hash) => ({
      codeHash: hash,
      tier: "pro",
      duration,
      createdBy,
    })),
  });

  return { codes, hashes };
}

// Redeem a membership code
export async function redeemCode(
  code: string,
  userId: string
): Promise<{ success: boolean; message: string; expiresAt?: Date }> {
  const normalizedCode = code.trim().toUpperCase();
  const hash = hashCode(normalizedCode);

  // Find the code
  const record = await prisma.membershipCode.findUnique({
    where: { codeHash: hash },
  });

  if (!record) {
    return { success: false, message: "会员码无效" };
  }

  if (record.usedBy) {
    return { success: false, message: "该会员码已被使用" };
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    return { success: false, message: "该会员码已过期" };
  }

  // Calculate expiration
  let expiresAt: Date | null = null;
  if (record.duration) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + record.duration);
  }

  // Use transaction to atomically redeem code and update user
  await prisma.$transaction([
    // Mark code as used
    prisma.membershipCode.update({
      where: { id: record.id },
      data: {
        usedBy: userId,
        usedAt: new Date(),
      },
    }),
    // Upgrade user
    prisma.user.update({
      where: { id: userId },
      data: {
        membership: record.tier,
        membershipId: `PRO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        membershipExpiresAt: expiresAt,
      },
    }),
  ]);

  return {
    success: true,
    message: expiresAt
      ? `升级成功！会员有效期至 ${expiresAt.toLocaleDateString("zh-CN")}`
      : "升级成功！永久会员",
    expiresAt: expiresAt || undefined,
  };
}

// Get code stats (admin)
export async function getCodeStats() {
  const [total, used, unused] = await Promise.all([
    prisma.membershipCode.count(),
    prisma.membershipCode.count({ where: { usedBy: { not: null } } }),
    prisma.membershipCode.count({ where: { usedBy: null } }),
  ]);

  return { total, used, unused };
}

// List recent codes (admin)
export async function listCodes(limit: number = 50) {
  return prisma.membershipCode.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
  });
}
