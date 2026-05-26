import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { upgradeToPro, downgradeToFree, generateMembershipId } from "@/lib/membership";
import { Crown, UserCheck, UserX, Search } from "lucide-react";

// Admin emails - add your email here
const ADMIN_EMAILS = ["admin@lingyan.com"];

export default async function MembershipAdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Check if user is admin
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  if (!currentUser || !ADMIN_EMAILS.includes(currentUser.email)) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h1 className="font-mono text-2xl font-bold mb-4">无权限</h1>
        <p className="text-muted-foreground">只有管理员可以访问此页面</p>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      membership: true,
      membershipId: true,
      membershipExpiresAt: true,
      createdAt: true,
      _count: {
        select: {
          novels: true,
          contents: true,
          videoProjects: true,
        },
      },
    },
  });

  async function handleUpgrade(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    const duration = formData.get("duration") as string;

    let expiresAt: Date | null = null;
    if (duration === "1month") {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (duration === "3months") {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);
    } else if (duration === "1year") {
      expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }
    // "permanent" = null (no expiration)

    await upgradeToPro(userId, expiresAt);
    revalidatePath("/workspace/admin/membership");
  }

  async function handleDowngrade(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    await downgradeToFree(userId);
    revalidatePath("/workspace/admin/membership");
  }

  const proCount = users.filter((u) => u.membership === "pro").length;
  const freeCount = users.filter((u) => u.membership === "free").length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-wide">会员管理</h1>
        <p className="text-sm text-muted-foreground mt-1">管理用户的会员状态</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">总用户</p>
          <p className="text-2xl font-mono font-bold">{users.length}</p>
        </div>
        <div className="space-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Pro 会员</p>
          <p className="text-2xl font-mono font-bold text-[var(--star)]">{proCount}</p>
        </div>
        <div className="space-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">免费用户</p>
          <p className="text-2xl font-mono font-bold text-muted-foreground">{freeCount}</p>
        </div>
      </div>

      {/* User list */}
      <div className="space-card rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-card-border">
          <h2 className="text-sm font-medium">用户列表</h2>
        </div>
        <div className="divide-y divide-card-border">
          {users.map((user) => {
            const isPro = user.membership === "pro";
            const isExpired = user.membershipExpiresAt && user.membershipExpiresAt < new Date();

            return (
              <div key={user.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{user.name || "未设置"}</span>
                    {isPro && !isExpired && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--star)]/20 text-[var(--star)]">
                        PRO
                      </span>
                    )}
                    {isExpired && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400">
                        已过期
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{user.email}</p>
                  {user.membershipId && (
                    <p className="text-[10px] text-muted-foreground">会员号: {user.membershipId}</p>
                  )}
                  {user.membershipExpiresAt && (
                    <p className="text-[10px] text-muted-foreground">
                      到期: {user.membershipExpiresAt.toLocaleDateString("zh-CN")}
                    </p>
                  )}
                </div>

                <div className="text-right text-[10px] text-muted-foreground">
                  <p>{user._count.novels} 本小说</p>
                  <p>{user._count.contents} 篇文章</p>
                  <p>{user._count.videoProjects} 个视频</p>
                </div>

                <div className="flex items-center gap-2">
                  {(!isPro || isExpired) ? (
                    <form action={handleUpgrade} className="flex items-center gap-1">
                      <input type="hidden" name="userId" value={user.id} />
                      <select name="duration" className="px-2 py-1 rounded bg-[var(--accent)] border border-card-border text-[10px] focus:outline-none">
                        <option value="1month">1个月</option>
                        <option value="3months">3个月</option>
                        <option value="1year">1年</option>
                        <option value="permanent">永久</option>
                      </select>
                      <button type="submit" className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[var(--star)]/10 text-[var(--star)] hover:bg-[var(--star)]/20 transition-colors">
                        <Crown size={10} /> 开通
                      </button>
                    </form>
                  ) : (
                    <form action={handleDowngrade}>
                      <input type="hidden" name="userId" value={user.id} />
                      <button type="submit" className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                        <UserX size={10} /> 降级
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
