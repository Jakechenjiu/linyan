import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { User, Brain, Video, Crown, ExternalLink, CheckCircle2, AlertCircle, Key } from "lucide-react";
import { checkMembership, FREE_LIMITS } from "@/lib/membership";
import MembershipCodeInput from "@/components/shared/MembershipCodeInput";
import ProviderSelector from "@/components/settings/ProviderSelector";

// AI 文本 Provider
const aiProviders = [
  { value: "xiaomimimo", label: "小米 MiMo", desc: "小米百亿tokens，免费额度", region: "国内" },
  { value: "deepseek", label: "DeepSeek", desc: "性价比最高，推荐", region: "国内" },
  { value: "qwen", label: "通义千问", desc: "阿里云，能力强", region: "国内" },
  { value: "zhipu", label: "智谱 GLM", desc: "清华系，中文优秀", region: "国内" },
  { value: "moonshot", label: "月之暗面", desc: "Kimi，长文本强", region: "国内" },
  { value: "spark", label: "讯飞星火", desc: "科大讯飞，语音强", region: "国内" },
  { value: "openai", label: "OpenAI", desc: "GPT-4o 等模型", region: "海外" },
  { value: "anthropic", label: "Anthropic", desc: "Claude 系列模型", region: "海外" },
  { value: "google", label: "Google", desc: "Gemini 系列模型", region: "海外" },
];

// 视频 Provider
const videoProviders = [
  { value: "dashscope", label: "通义万相", desc: "阿里云，推荐", region: "国内", envKey: "DASHSCOPE_API_KEY" },
  { value: "kling", label: "可灵", desc: "快手，质量高", region: "国内", envKey: "KLING_API_KEY" },
  { value: "zhipu", label: "智谱 CogVideoX", desc: "清华系，开源模型", region: "国内", envKey: "ZHIPU_API_KEY" },
  { value: "stability", label: "Stability AI", desc: "Stable Video Diffusion", region: "海外", envKey: "STABILITY_API_KEY" },
];

const providerKeyLinks: Record<string, string> = {
  xiaomimimo: "https://token-plan-cn.xiaomimimo.com",
  deepseek: "https://platform.deepseek.com/api_keys",
  qwen: "https://dashscope.console.aliyun.com/apiKey",
  zhipu: "https://open.bigmodel.cn/usercenter/apikeys",
  moonshot: "https://platform.moonshot.cn/console/api-keys",
  spark: "https://console.xfyun.cn/services/bm4",
  openai: "https://platform.openai.com/api-keys",
  anthropic: "https://console.anthropic.com/settings/keys",
  google: "https://aistudio.google.com/apikey",
  dashscope: "https://dashscope.console.aliyun.com/apiKey",
  kling: "https://klingai.com/developer/api-keys",
  stability: "https://platform.stability.ai/account/keys",
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
      select: {
        id: true, name: true, email: true,
        apiKey: true, apiProvider: true, dashscopeApiKey: true,
        membership: true, membershipId: true, membershipExpiresAt: true,
      },
    });
  } catch {
    user = null;
  }

  const membership = session.user.id
    ? await checkMembership(session.user.id)
    : { tier: "free" as const, isActive: false };

  async function saveSettings(formData: FormData) {
    "use server";
    let s;
    try { s = await auth(); } catch { return; }
    if (!s?.user?.id) return;

    const name = formData.get("name") as string;
    const apiKey = formData.get("apiKey") as string;
    const apiProvider = formData.get("apiProvider") as string;
    const dashscopeApiKey = formData.get("dashscopeApiKey") as string;

    try {
      const data: Record<string, string | null> = {};
      if (name?.trim()) data.name = name.trim();
      if (apiKey?.trim()) data.apiKey = apiKey.trim();
      if (dashscopeApiKey?.trim()) data.dashscopeApiKey = dashscopeApiKey.trim();
      data.apiProvider = apiProvider || "deepseek";

      await prisma.user.update({ where: { id: s.user.id }, data });
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
    revalidatePath("/workspace/settings");
  }

  const hasTextKey = !!user?.apiKey;
  const hasDashscopeKey = !!(user?.dashscopeApiKey || process.env.DASHSCOPE_API_KEY);
  const maskedTextKey = user?.apiKey ? user.apiKey.slice(0, 8) + "•••" + user.apiKey.slice(-4) : null;
  const maskedDashscopeKey = user?.dashscopeApiKey ? user.dashscopeApiKey.slice(0, 8) + "•••" + user.dashscopeApiKey.slice(-4) : null;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-wide">设置</h1>
        <p className="text-sm text-muted-foreground mt-1">管理账户与 API 接入</p>
      </div>

      {/* ===== 会员状态 ===== */}
      <div id="membership" className="space-card rounded-2xl p-6 scroll-mt-24">
        <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
          <Crown size={20} className="text-[var(--star)]" />
          会员状态
        </h2>

        {membership.isActive ? (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--star)]/5 border border-[var(--star)]/20">
            <div className="w-12 h-12 rounded-xl bg-[var(--star)]/10 flex items-center justify-center">
              <Crown size={24} className="text-[var(--star)]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--star)]">Pro 会员</p>
              {user?.membershipId && <p className="text-[11px] text-muted-foreground">会员号: {user.membershipId}</p>}
              {user?.membershipExpiresAt
                ? <p className="text-[11px] text-muted-foreground">有效期至: {user.membershipExpiresAt.toLocaleDateString("zh-CN")}</p>
                : <p className="text-[11px] text-muted-foreground">永久有效</p>
              }
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--accent)] border border-card-border">
              <div className="w-12 h-12 rounded-xl bg-muted-foreground/10 flex items-center justify-center">
                <User size={24} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold">免费版</p>
                <p className="text-[11px] text-muted-foreground">
                  最多 {FREE_LIMITS.maxNovels} 本小说 · 每本 {FREE_LIMITS.maxChaptersPerNovel} 章 · 无 AI 对话编辑
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--star)]/5 border border-[var(--star)]/20">
              <p className="text-sm font-bold text-[var(--star)] mb-2">解锁全部功能</p>
              <ul className="text-[11px] text-muted-foreground space-y-1 mb-4">
                <li>• 无限小说和章节数</li>
                <li>• AI 对话编辑（实时协作改写）</li>
                <li>• 灵思笔记 · 知识图谱</li>
                <li>• 万象推演 · 多智能体模拟</li>
                <li>• 导出 EPUB / PDF</li>
              </ul>
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">输入会员码激活：</p>
                <MembershipCodeInput />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== 账户信息 ===== */}
      <form action={saveSettings} className="space-y-8">
        <div className="space-card rounded-2xl p-6">
          <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
            <User size={20} className="text-[var(--cyan)]" />
            账户信息
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">用户名</label>
              <input
                name="name"
                defaultValue={user?.name ?? ""}
                className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">邮箱</label>
              <input
                defaultValue={session.user.email ?? ""}
                disabled
                className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-card-border text-sm text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* ===== AI 文本 API ===== */}
        <div id="ai-text" className="space-card rounded-2xl p-6 scroll-mt-24">
          <h2 className="font-mono text-lg font-bold mb-1 flex items-center gap-2">
            <Brain size={20} className="text-[var(--cyan)]" />
            AI 文本生成
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            驱动星图写作、光子发布、灵思笔记、万象推演的所有 AI 功能
          </p>

          {/* Provider 选择 */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">API 提供商</label>
            <ProviderSelector
              providers={aiProviders}
              defaultValue={user?.apiProvider || "deepseek"}
              name="apiProvider"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              API Key
              {maskedTextKey && (
                <span className="text-xs text-muted-foreground ml-2">
                  当前: <span className="text-[var(--cyan)] font-mono">{maskedTextKey}</span>
                </span>
              )}
            </label>
            <input
              name="apiKey"
              type="password"
              placeholder="输入你的 API Key"
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors"
            />
            <div className="flex items-center gap-2 mt-2">
              <a
                href={providerKeyLinks[user?.apiProvider || "deepseek"]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[var(--cyan)] hover:underline flex items-center gap-1"
              >
                获取 API Key <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>

        {/* ===== 视频生成 API ===== */}
        <div id="video" className="space-card rounded-2xl p-6 scroll-mt-24">
          <h2 className="font-mono text-lg font-bold mb-1 flex items-center gap-2">
            <Video size={20} className="text-[var(--nebula)]" />
            视频生成
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            驱动光子发布的 AI 视频生成功能
          </p>

          {/* 视频 Provider 列表 */}
          <div className="space-y-3 mb-4">
            {videoProviders.map((vp) => (
              <div key={vp.value} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--background)] border border-card-border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{vp.label}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent)] text-muted-foreground">{vp.region}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{vp.desc}</p>
                </div>
                <a
                  href={providerKeyLinks[vp.value] || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-[var(--cyan)] hover:underline flex items-center gap-1"
                >
                  获取 Key <ExternalLink size={9} />
                </a>
              </div>
            ))}
          </div>

          {/* DashScope API Key */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              通义万相 API Key
              {maskedDashscopeKey && (
                <span className="text-xs text-muted-foreground ml-2">
                  当前: <span className="text-[var(--nebula)] font-mono">{maskedDashscopeKey}</span>
                </span>
              )}
            </label>
            <input
              name="dashscopeApiKey"
              type="password"
              placeholder="输入通义万相 API Key（推荐）"
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--nebula)] transition-colors"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              通义万相是默认视频生成引擎，可灵和智谱作为备选
            </p>
          </div>
        </div>

        {/* 保存按钮 */}
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
