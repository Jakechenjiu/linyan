import { prisma } from "./db";

export type MembershipTier = "free" | "pro";

export interface MembershipInfo {
  tier: MembershipTier;
  membershipId: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  isExpired: boolean;
}

// Check if user has active pro membership
export async function checkMembership(userId: string): Promise<MembershipInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      membership: true,
      membershipId: true,
      membershipExpiresAt: true,
    },
  });

  if (!user) {
    return { tier: "free", membershipId: null, expiresAt: null, isActive: false, isExpired: false };
  }

  const tier = user.membership as MembershipTier;
  const isExpired = user.membershipExpiresAt ? user.membershipExpiresAt < new Date() : false;
  const isActive = tier === "pro" && !isExpired;

  return {
    tier,
    membershipId: user.membershipId,
    expiresAt: user.membershipExpiresAt,
    isActive,
    isExpired,
  };
}

// Generate membership ID
export function generateMembershipId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `PRO-${dateStr}-${random}`;
}

// Admin: Upgrade user to pro
export async function upgradeToPro(
  userId: string,
  expiresAt: Date | null = null
): Promise<{ success: boolean; membershipId: string }> {
  const membershipId = generateMembershipId();

  await prisma.user.update({
    where: { id: userId },
    data: {
      membership: "pro",
      membershipId,
      membershipExpiresAt: expiresAt,
    },
  });

  return { success: true, membershipId };
}

// Admin: Downgrade user to free
export async function downgradeToFree(userId: string): Promise<{ success: boolean }> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      membership: "free",
      membershipId: null,
      membershipExpiresAt: null,
    },
  });

  return { success: true };
}

// Feature limits for free users
export const FREE_LIMITS = {
  maxNovels: 2,           // 最多2本小说
  maxChaptersPerNovel: 10, // 每本小说最多10章
  maxContents: 5,          // 最多5篇文章
  maxVideoProjects: 1,     // 最多1个视频项目
  hasWanxiang: false,      // 无万象推演
  hasNotes: false,         // 无灵思笔记
  hasMindmaps: false,      // 无脑图
  hasExport: false,        // 无导出功能
  hasAiChat: false,        // 无AI对话编辑
  hasBatchGenerate: false, // 无批量生成
};

// Check if user can access a feature
export async function canAccessFeature(
  userId: string,
  feature: keyof typeof FREE_LIMITS
): Promise<boolean> {
  const membership = await checkMembership(userId);
  if (membership.isActive) return true;
  return FREE_LIMITS[feature] as boolean;
}

// Check if user has reached a limit
export async function hasReachedLimit(
  userId: string,
  resource: "novels" | "contents" | "videoProjects"
): Promise<{ reached: boolean; current: number; limit: number }> {
  const membership = await checkMembership(userId);
  if (membership.isActive) return { reached: false, current: 0, limit: Infinity };

  let current = 0;
  let limit = 0;

  switch (resource) {
    case "novels":
      current = await prisma.novel.count({ where: { userId } });
      limit = FREE_LIMITS.maxNovels;
      break;
    case "contents":
      current = await prisma.content.count({ where: { userId } });
      limit = FREE_LIMITS.maxContents;
      break;
    case "videoProjects":
      current = await prisma.videoProject.count({ where: { userId } });
      limit = FREE_LIMITS.maxVideoProjects;
      break;
  }

  return { reached: current >= limit, current, limit };
}
