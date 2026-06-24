import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { User, Brain, Video, ExternalLink, CheckCircle2, AlertCircle, Key, Zap, BookOpen, Sparkles, TrendingUp, Users, Shield, FileText } from "lucide-react";
import { invalidateAiConfigCache } from "@/lib/ai";
import ProviderSelector from "@/components/settings/ProviderSelector";
import ApiTestButton from "@/components/settings/ApiTestButton";

// AI 文本 Provider
const aiProviders = [
  { value: "xiaomimimo", label: "小米 MiMo", desc: "免费额度，适合入门", region: "国内", features: "AI对话 · 基础写作" },
  { value: "deepseek", label: "DeepSeek", desc: "性价比最高，推荐", region: "国内", features: "AI对话 · 多Agent管线 · 审计 · 角色Agent · 编辑部" },
  { value: "qwen", label: "通义千问", desc: "阿里云，能力强", region: "国内", features: "AI对话 · 多Agent管线 · 审计 · 角色Agent" },
  { value: "zhipu", label: "智谱 GLM", desc: "清华系，中文优秀", region: "国内", features: "AI对话 · 基础写作" },
  { value: "moonshot", label: "月之暗面", desc: "Kimi，长文本强", region: "国内", features: "AI对话 · 长文分析" },
  { value: "spark", label: "讯飞星火", desc: "科大讯飞，语音强", region: "国内", features: "AI对话 · 基础写作" },
  { value: "openai", label: "OpenAI", desc: "GPT-4o 等模型", region: "海外", features: "全部功能" },
  { value: "anthropic", label: "Anthropic", desc: "Claude 系列模型", region: "海外", features: "全部功能" },
  { value: "google", label: "Google", desc: "Gemini 系列模型", region: "海外", features: "全部功能" },
];

// 视频 Provider
const videoProviders = [
  { value: "dashscope", label: "通义万相", desc: "阿里云，推荐", region: "国内", envKey: "DASHSCOPE_API_KEY" },
  { value: "kling", label: "可灵", desc: "快手，质量高", region: "国内", envKey: "KLING_API_KEY" },
  { value: "zhipu", label: "智谱 CogVideoX", desc: "清华系，开源模型", region: "国内", envKey: "ZHIPU_API_KEY" },
  { value: "stability", label: "Stability AI", desc: "Stable Video Diffusion", region: "海外", envKey: "STABILITY_API_KEY" },
];

const providerEndpoints: Record<string, string> = {
  xiaomimimo: "https://token-plan-cn.xiaomimimo.com/v1",
  deepseek: "https://api.deepseek.com/v1",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  zhipu: "https://open.bigmodel.cn/api/paas/v4",
  moonshot: "https://api.moonshot.cn/v1",
  spark: "https://spark-api-open.xf-yun.com/v1",
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com",
  google: "https://generativelanguage.googleapis.com/v1beta",
};

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
      },
    });
  } catch {
    user = null;
  }

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

      // 清除配置缓存，让新配置立即生效
      invalidateAiConfigCache(s.user.id);
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

      {/* ===== 快速开始 ===== */}
      <div className="space-card rounded-2xl p-6">
        <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
          <Zap size={20} className="text-[var(--star)]" />
          快速开始
        </h2>
        <div className="flex items-center gap-3">
          {[
            { step: 1, label: "配置 API Key", done: hasTextKey },
            { step: 2, label: "创建小说", done: false },
            { step: 3, label: "开始写作", done: false },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                s.done
                  ? "bg-emerald-500/20 text-emerald-400"
                  : i === 0
                  ? "bg-[var(--cyan)]/20 text-[var(--cyan)]"
                  : "bg-[var(--accent)] text-muted-foreground"
              }`}>
                {s.done ? <CheckCircle2 size={16} /> : s.step}
              </div>
              <div className="flex-1">
                <p className={`text-[11px] font-medium ${s.done ? "text-emerald-400" : ""}`}>{s.label}</p>
                {s.done && <p className="text-[9px] text-muted-foreground">已完成</p>}
              </div>
              {i < 2 && <div className="w-8 h-px bg-card-border" />}
            </div>
          ))}
        </div>
      </div>

      {/* ===== 功能指南 ===== */}
      <div className="space-card rounded-2xl p-6">
        <h2 className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
          <BookOpen size={20} className="text-[var(--cyan)]" />
          星图核心功能
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Shield size={14} />, label: "AI味审计", desc: "20维度检测AI痕迹", color: "var(--cyan)" },
            { icon: <Users size={14} />, label: "编辑部评审", desc: "5位虚拟专家审稿", color: "var(--nebula)" },
            { icon: <Sparkles size={14} />, label: "角色Agent", desc: "大五人格独立记忆", color: "var(--star)" },
            { icon: <TrendingUp size={14} />, label: "情感曲线", desc: "5维度情绪可视化", color: "var(--star)" },
            { icon: <FileText size={14} />, label: "内联AI编辑", desc: "选中文字即时改写", color: "var(--cyan)" },
            { icon: <Zap size={14} />, label: "多Agent管线", desc: "7阶段自动写作", color: "var(--cyan)" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[var(--background)] border border-card-border">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${f.color}15`, color: f.color }}>
                {f.icon}
              </div>
              <div>
                <p className="text-[11px] font-medium">{f.label}</p>
                <p className="text-[9px] text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
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
            {/* Provider 功能说明 */}
            <div className="mt-2 p-2.5 rounded-lg bg-[var(--background)] border border-card-border">
              <p className="text-[10px] text-muted-foreground">
                <span className="font-medium text-foreground">推荐：</span>DeepSeek 性价比最高，支持全部功能。小米 MiMo 免费额度适合入门，但不支持多Agent管线和编辑部评审。
              </p>
            </div>
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
            <div className="flex items-center gap-4 mt-2">
              <a
                href={providerKeyLinks[user?.apiProvider || "deepseek"]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[var(--cyan)] hover:underline flex items-center gap-1"
              >
                获取 API Key <ExternalLink size={10} />
              </a>
              <ApiTestButton
                provider={user?.apiProvider || "deepseek"}
                apiKey={user?.apiKey || ""}
                baseUrl={providerEndpoints[user?.apiProvider || "deepseek"]}
              />
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
