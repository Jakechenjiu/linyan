import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { User, Settings, Shield } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-wide">设置</h1>
        <p className="text-sm text-muted-foreground mt-1">管理你的账户和偏好</p>
      </div>

      {/* Profile */}
      <div className="space-card rounded-2xl p-6">
        <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
          <User size={20} className="text-[var(--cyan)]" />
          账户信息
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">用户名</label>
            <input
              defaultValue={session.user.name ?? ""}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">邮箱</label>
            <input
              defaultValue={session.user.email ?? ""}
              disabled
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-card-border text-sm text-muted-foreground"
            />
          </div>
          <button
            type="button"
            className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--cyan-soft)] text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-[#0a0e17] transition-all"
          >
            保存修改
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="space-card rounded-2xl p-6">
        <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
          <Settings size={20} className="text-[var(--nebula)]" />
          偏好设置
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">AI 默认模型</p>
              <p className="text-xs text-muted-foreground">选择创作时使用的 AI 模型</p>
            </div>
            <select className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-card-border text-xs focus:outline-none">
              <option>DeepSeek V4</option>
              <option>Claude Opus 4.7</option>
              <option>GPT-4o</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">公开作品集</p>
              <p className="text-xs text-muted-foreground">允许他人在探索页发现你的公开作品</p>
            </div>
            <input type="checkbox" defaultChecked className="accent-[var(--cyan)] w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="space-card rounded-2xl p-6">
        <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
          <Shield size={20} className="text-[var(--star)]" />
          安全
        </h2>
        <button
          type="button"
          className="px-5 py-2 rounded-xl text-sm font-medium border border-card-border text-muted-foreground hover:border-red-400 hover:text-red-400 transition-colors"
        >
          修改密码
        </button>
      </div>
    </div>
  );
}
