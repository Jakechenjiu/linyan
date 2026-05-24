import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { User, Settings, Shield, Key, Zap, Eye, EyeOff, Film } from "lucide-react";

const providerOptions = [
  { value: "deepseek", label: "DeepSeek", desc: "性价比最高，推荐" },
  { value: "openai", label: "OpenAI", desc: "GPT-4o 等模型" },
  { value: "anthropic", label: "Anthropic", desc: "Claude 系列模型" },
];

const providerEndpoints: Record<string, string> = {
  deepseek: "https://api.deepseek.com/v1",
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com",
};

export default async function SettingsPage() {
  let session;
  try {
    session = await auth();
  } catch {
    return (
      <div className="space-y-8 max-w-3xl">
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-sm text-red-400">
          身份验证失败，请刷新页面重试。
        </div>
      </div>
    );
  }
  if (!session?.user) redirect("/login");

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, apiKey: true, apiProvider: true, dashscopeApiKey: true },
    });
  } catch {
    user = null;
  }

  async function saveSettings(formData: FormData) {
    "use server";
    let s;
    try {
      s = await auth();
    } catch {
      return;
    }
    if (!s?.user?.id) return;

    const name = formData.get("name") as string;
    const apiKey = formData.get("apiKey") as string;
    const apiProvider = formData.get("apiProvider") as string;
    const dashscopeApiKey = formData.get("dashscopeApiKey") as string;

    try {
      await prisma.user.update({
        where: { id: s.user.id },
        data: {
          name: name?.trim() || null,
          apiKey: apiKey?.trim() || null,
          apiProvider: apiProvider || "deepseek",
          dashscopeApiKey: dashscopeApiKey?.trim() || null,
        },
      });
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
    revalidatePath("/workspace/settings");
  }

  const maskedKey = user?.apiKey
    ? user.apiKey.slice(0, 8) + "•••" + user.apiKey.slice(-4)
    : null;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-wide">设置</h1>
        <p className="text-sm text-muted-foreground mt-1">管理账户和 AI 接入</p>
      </div>

      {!user && (
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-400">
          用户数据加载失败，部分设置可能无法显示。请刷新重试。
        </div>
      )}

      <form action={saveSettings} className="space-y-8">
        {/* API Configuration */}
        <div className="space-card rounded-2xl p-6">
          <h2 className="font-mono text-lg font-bold mb-1 flex items-center gap-2">
            <Key size={20} className="text-[var(--star)]" />
            AI API 配置
          </h2>
          <p className="text-xs text-muted-foreground mb-6">配置你自己的 AI API Key，AI 续写和审查功能将使用你的额度</p>

          <div className="space-y-4">
            {/* Provider */}
            <div>
              <label className="text-sm font-medium mb-2 block">API 提供商</label>
              <div className="grid grid-cols-3 gap-2">
                {providerOptions.map((p) => (
                  <label
                    key={p.value}
                    className={`p-3 rounded-xl text-center cursor-pointer transition-all border ${
                      (user?.apiProvider || "deepseek") === p.value
                        ? "border-[var(--cyan)] bg-[var(--cyan-soft)]"
                        : "border-card-border hover:border-[var(--cyan)] hover:bg-[var(--accent)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="apiProvider"
                      value={p.value}
                      defaultChecked={(user?.apiProvider || "deepseek") === p.value}
                      className="hidden"
                    />
                    <Zap size={14} className="mx-auto mb-1 text-[var(--cyan)]" />
                    <div className="text-xs font-medium">{p.label}</div>
                    <div className="text-[10px] text-muted-foreground">{p.desc}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                API Key
                {maskedKey && (
                  <span className="text-xs text-muted-foreground ml-2">
                    当前: <span className="text-[var(--cyan)] font-mono">{maskedKey}</span>
                  </span>
                )}
              </label>
              <input
                name="apiKey"
                placeholder={maskedKey ? "输入新 Key 替换…" : "sk-…"}
                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-card-border text-sm font-mono focus:outline-none focus:border-[var(--cyan)] transition-colors"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                端点：{providerEndpoints[user?.apiProvider || "deepseek"]} &nbsp;|&nbsp;
                {user?.apiProvider === "deepseek"
                  ? "从 DeepSeek 控制台获取 → platform.deepseek.com"
                  : user?.apiProvider === "openai"
                    ? "从 OpenAI 控制台获取 → platform.openai.com"
                    : "从 Anthropic 控制台获取 → console.anthropic.com"}
              </p>
            </div>

            {/* Cost note */}
            <div className="p-3 rounded-xl bg-[var(--accent)] border border-card-border">
              <p className="text-xs text-muted-foreground">
                <span className="text-[var(--star)] font-medium">费用说明：</span>
                API 调用由你选择的 AI 提供商直接计费。
                DeepSeek 约 ¥1/百万 token，一篇 3000 字章节续写约 ¥0.01-0.03。
                不填 Key 时将使用系统默认 Key（限流）。
              </p>
            </div>
          </div>
        </div>

        {/* DashScope Video API */}
        <div className="space-card rounded-2xl p-6">
          <h2 className="font-mono text-lg font-bold mb-1 flex items-center gap-2">
            <Film size={20} className="text-[var(--nebula)]" />
            通义万相（视频生成）
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            AI 短视频工厂使用阿里云 DashScope 通义万相 API 生成视频素材。配置后即可使用 AI 视频生成功能。
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                DashScope API Key
                {(user?.dashscopeApiKey || process.env.DASHSCOPE_API_KEY) ? (
                  <span className="text-xs text-green-400 ml-2">已配置</span>
                ) : (
                  <span className="text-xs text-muted-foreground ml-2">未配置</span>
                )}
              </label>
              <input
                name="dashscopeApiKey"
                placeholder={user?.dashscopeApiKey
                  ? `当前: ${user.dashscopeApiKey.slice(0, 8)}•••${user.dashscopeApiKey.slice(-4)} — 输入新 Key 替换`
                  : process.env.DASHSCOPE_API_KEY
                    ? "已通过环境变量配置"
                    : "sk-…"}
                disabled={!!process.env.DASHSCOPE_API_KEY}
                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-card-border text-sm font-mono focus:outline-none focus:border-[var(--cyan)] transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                从阿里云 DashScope 控制台获取 →{" "}
                <a href="https://dashscope.console.aliyun.com" target="_blank" rel="noopener noreferrer" className="text-[var(--cyan)] underline">
                  dashscope.console.aliyun.com
                </a>
                {process.env.DASHSCOPE_API_KEY && (
                  <span className="ml-2 text-[var(--star)]">（已通过环境变量全局配置，无需在此填写）</span>
                )}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--accent)] border border-card-border">
              <p className="text-xs text-muted-foreground">
                <span className="text-[var(--nebula)] font-medium">通义万相计费：</span>
                按生成次数计费，生成一段 5 秒视频约 ¥0.3-1.0（以阿里云实际定价为准）。
                如果不使用 AI 生成视频素材，可直接导出脚本到剪映手动制作，
                无需配置此 Key。
              </p>
            </div>
          </div>
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
                name="name"
                defaultValue={user?.name ?? ""}
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
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
            style={{ color: "#0a0e17" }}
          >
            保存设置
          </button>
        </div>
      </form>
    </div>
  );
}
