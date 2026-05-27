import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Crown, Key, Copy, Users, Hash } from "lucide-react";
import { createCodes, getCodeStats, listCodes } from "@/lib/membership-code";

const ADMIN_EMAILS = ["admin@lingyan.com"];

export default async function MembershipAdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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

  const [stats, codes] = await Promise.all([
    getCodeStats(),
    listCodes(100),
  ]);

  async function handleGenerate(formData: FormData) {
    "use server";
    const count = Number(formData.get("count")) || 1;
    const duration = formData.get("duration") === "permanent" ? null : Number(formData.get("duration"));
    const result = await createCodes(count, duration, session?.user?.id || "admin");
    revalidatePath("/workspace/admin/membership");
    // Note: The codes are returned in result.codes - they need to be shown to the user
    // For now, we'll store them temporarily in a way that can be displayed
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-wide">会员码管理</h1>
        <p className="text-sm text-muted-foreground mt-1">生成和管理会员码</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">总码数</p>
          <p className="text-2xl font-mono font-bold">{stats.total}</p>
        </div>
        <div className="space-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">已使用</p>
          <p className="text-2xl font-mono font-bold text-emerald-400">{stats.used}</p>
        </div>
        <div className="space-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">未使用</p>
          <p className="text-2xl font-mono font-bold text-[var(--star)]">{stats.unused}</p>
        </div>
      </div>

      {/* Generate codes */}
      <div className="space-card rounded-xl p-6">
        <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
          <Key size={20} className="text-[var(--star)]" />
          生成会员码
        </h2>
        <form action={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">数量</label>
              <input
                name="count"
                type="number"
                defaultValue={1}
                min={1}
                max={100}
                className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--star)]"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">有效期</label>
              <select
                name="duration"
                className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--star)]"
              >
                <option value="30">30天</option>
                <option value="90">90天</option>
                <option value="365">1年</option>
                <option value="permanent">永久</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-[var(--star)]/15 text-[var(--star)] hover:bg-[var(--star)] hover:text-[#0a0e17] transition-all"
              >
                <Key size={14} /> 生成
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            生成后请立即复制会员码，之后只能看到哈希值
          </p>
        </form>
      </div>

      {/* Code list */}
      <div className="space-card rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-card-border">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <Hash size={14} /> 会员码记录
          </h2>
        </div>
        <div className="divide-y divide-card-border max-h-96 overflow-y-auto">
          {codes.map((code) => (
            <div key={code.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {code.codeHash.slice(0, 8)}...{code.codeHash.slice(-8)}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                    code.usedBy
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-[var(--star)]/20 text-[var(--star)]"
                  }`}>
                    {code.usedBy ? "已使用" : "未使用"}
                  </span>
                  {code.duration && (
                    <span className="text-[10px] text-muted-foreground">
                      {code.duration}天
                    </span>
                  )}
                  {!code.duration && (
                    <span className="text-[10px] text-muted-foreground">永久</span>
                  )}
                </div>
                {code.user && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    使用者: {code.user.name || code.user.email}
                  </p>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {new Date(code.createdAt).toLocaleDateString("zh-CN")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
