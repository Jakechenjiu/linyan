import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { User, Film, Network, ExternalLink, CheckCircle2, AlertCircle, Brain, ArrowRight } from "lucide-react";

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

const providerKeyLinks: Record<string, string> = {
  deepseek: "https://platform.deepseek.com/api_keys",
  openai: "https://platform.openai.com/api-keys",
  anthropic: "https://console.anthropic.com/settings/keys",
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
      // Only update fields that have actual input; empty = keep existing value
      const data: Record<string, string | null> = {};
      if (name?.trim()) data.name = name.trim();
      if (apiKey?.trim()) data.apiKey = apiKey.trim();
      if (dashscopeApiKey?.trim()) data.dashscopeApiKey = dashscopeApiKey.trim();
      data.apiProvider = apiProvider || "deepseek";

      await prisma.user.update({
        where: { id: s.user.id },
        data,
      });
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
    revalidatePath("/workspace/settings");
  }

  const hasTextKey = !!user?.apiKey;
  const hasDashscopeKey = !!(user?.dashscopeApiKey || process.env.DASHSCOPE_API_KEY);
  const hasWanxiang = !!process.env.WANXIANG_URL;
  const maskedTextKey = user?.apiKey
    ? user.apiKey.slice(0, 8) + "•••" + user.apiKey.slice(-4)
    : null;

  const apiOverview = [
    {
      label: "AI 文本生成",
      icon: <Brain size={18} />,
      color: "var(--cyan)",
      configured: hasTextKey,
      modules: ["灵思笔记 · AI 续写/润色/摘要/标签/对话", "星图写作 · AI 续写", "光子发布 · 脚本生成", "万象推演 · AI 深度分析"],
      href: "#ai-text",
    },
    {
      label: "通义万相",
      icon: <Film size={18} />,
      color: "var(--nebula)",
      configured: hasDashscopeKey,
      modules: ["光子发布 · AI 视频生成", "光子发布 · TTS 配音"],
      href: "#dashscope",
    },
    {
      label: "万象推演引擎",
      icon: <Network size={18} />,
      color: "var(--star)",
      configured: hasWanxiang,
      modules: ["万象推演 · 多智能体预测"],
      href: "#wanxiang",
    },
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-wide">设置</h1>
        <p className="text-sm text-muted-foreground mt-1">管理账户与 API 接入</p>
      </div>

      {!user && (
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-400">
          用户数据加载失败，部分设置可能无法显示。请刷新重试。
        </div>
      )}

      {/* ===== API 接入总览 ===== */}
      <div className="space-card rounded-2xl p-6">
        <h2 className="font-mono text-lg font-bold mb-1">API 接入总览</h2>
        <p className="text-xs text-muted-foreground mb-5">
          灵砚依赖以下 API 服务。每个 API 独立配置，按需启用。
        </p>
        <div className="grid gap-3">
          {apiOverview.map((api) => (
            <a
              key={api.label}
              href={api.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-card-border bg-[var(--bg-elevated)]/50 hover:border-[var(--cyan)]/30 transition-all group"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${api.color}15`, color: api.color }}
              >
                {api.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{api.label}</span>
                  {api.configured ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-green-400">
                      <CheckCircle2 size={10} /> 已配置
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <AlertCircle size={10} /> 未配置
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {api.modules.join("  ·  ")}
                </p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-[var(--cyan)] transition-colors shrink-0" />
            </a>
          ))}
        </div>
      </div>

      <form action={saveSettings} className="space-y-8">
        {/* ===== AI 文本 API ===== */}
        <div id="ai-text" className="space-card rounded-2xl p-6 scroll-mt-24">
          <h2 className="font-mono text-lg font-bold mb-1 flex items-center gap-2">
            <Brain size={20} className="text-[var(--cyan)]" />
            AI 文本生成
          </h2>
          <p className="text-xs text-muted-foreground mb-2">
            提供 AI 续写、内容审查、脚本生成等文本能力
          </p>
          <div className="flex items-center gap-2 mb-5 text-[11px] flex-wrap">
            <span className="px-2 py-0.5 rounded bg-[var(--cyan-soft)] text-[var(--cyan)]">灵思笔记</span>
            <span className="px-2 py-0.5 rounded bg-[var(--cyan-soft)] text-[var(--cyan)]">星图写作</span>
            <span className="px-2 py-0.5 rounded bg-[var(--cyan-soft)] text-[var(--cyan)]">光子发布</span>
            <span className="px-2 py-0.5 rounded bg-[var(--cyan-soft)] text-[var(--cyan)]">万象推演</span>
          </div>

          {/* Feature detail */}
          <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-card-border mb-5 space-y-1.5">
            <h3 className="text-xs font-bold">此 API 驱动以下功能</h3>
            <div className="grid gap-1 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="text-[var(--cyan)] shrink-0">灵思笔记</span>
                <span>AI 续写 · 润色 · 摘要 · 标签建议 · 基于笔记对话</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--cyan)] shrink-0">星图写作</span>
                <span>AI 续写长篇小说 · 内容审查</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--cyan)] shrink-0">光子发布</span>
                <span>AI 脚本生成 · 标题优化</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--cyan)] shrink-0">万象推演</span>
                <span>推演结果 AI 深度分析（转折点/风险/行动建议）</span>
              </div>
            </div>
          </div>

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
                {maskedTextKey && (
                  <span className="text-xs text-muted-foreground ml-2">
                    当前: <span className="text-[var(--cyan)] font-mono">{maskedTextKey}</span>
                  </span>
                )}
              </label>
              <input
                name="apiKey"
                placeholder={maskedTextKey ? "输入新 Key 替换…" : "sk-…"}
                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-card-border text-sm font-mono focus:outline-none focus:border-[var(--cyan)] transition-colors"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                端点：{providerEndpoints[user?.apiProvider || "deepseek"]}
              </p>
              <a
                href={providerKeyLinks[user?.apiProvider || "deepseek"]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-[var(--cyan)] hover:underline mt-0.5"
              >
                获取 API Key <ExternalLink size={10} />
              </a>
            </div>

            {/* Cost note */}
            <div className="p-3 rounded-xl bg-[var(--accent)] border border-card-border">
              <p className="text-xs text-muted-foreground">
                <span className="text-[var(--star)] font-medium">计费：</span>
                由所选 AI 提供商直接收取。DeepSeek 约 ¥1/百万 token，一篇 3000 字续写约 ¥0.01-0.03。
                不填 Key 时使用系统默认 Key（限流，响应较慢）。
              </p>
            </div>
          </div>
        </div>

        {/* ===== 通义万相视频 API ===== */}
        <div id="dashscope" className="space-card rounded-2xl p-6 scroll-mt-24">
          <h2 className="font-mono text-lg font-bold mb-1 flex items-center gap-2">
            <Film size={20} className="text-[var(--nebula)]" />
            通义万相（视频 + 语音）
          </h2>
          <p className="text-xs text-muted-foreground mb-2">
            阿里云 DashScope 提供 AI 视频生成与 TTS 语音合成能力
          </p>
          <div className="flex items-center gap-2 mb-5 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-[var(--nebula)]/10 text-[var(--nebula)]">光子发布 · 视频生成</span>
            <span className="px-2 py-0.5 rounded bg-[var(--nebula)]/10 text-[var(--nebula)]">光子发布 · TTS 配音</span>
          </div>

          <div className="space-y-4">
            {/* Model info card */}
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-card-border">
              <h3 className="text-sm font-bold mb-2">当前使用模型</h3>
              <div className="grid gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">视频生成</span>
                  <span className="font-mono text-[var(--nebula)]">wan2.6-t2v</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">支持分辨率</span>
                  <span className="font-mono">1080×1920（竖屏），720×1280</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">视频时长</span>
                  <span>2-15 秒</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">语音合成</span>
                  <span className="font-mono text-[var(--nebula)]">qwen-tts（支持多音色）</span>
                </div>
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                DashScope API Key
                {hasDashscopeKey ? (
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
              <div className="flex items-center gap-3 mt-1.5">
                <a
                  href="https://dashscope.console.aliyun.com/apiKey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-[var(--cyan)] hover:underline"
                >
                  获取 DashScope API Key <ExternalLink size={10} />
                </a>
                <span className="text-[10px] text-muted-foreground">|</span>
                <a
                  href="https://help.aliyun.com/zh/model-studio/wanxiang-video-generation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-[var(--cyan)] hover:underline"
                >
                  模型文档 <ExternalLink size={10} />
                </a>
              </div>
              {process.env.DASHSCOPE_API_KEY && (
                <p className="text-[10px] text-[var(--star)] mt-1">
                  已通过环境变量 DASHSCOPE_API_KEY 全局配置，无需在此填写
                </p>
              )}
            </div>

            {/* Cost note */}
            <div className="p-3 rounded-xl bg-[var(--accent)] border border-card-border">
              <p className="text-xs text-muted-foreground">
                <span className="text-[var(--nebula)] font-medium">计费：</span>
                视频生成按次计费，5 秒竖屏视频约 ¥0.3-1.0/次（以阿里云实际定价为准）。
                TTS 语音合成约 ¥0.002/千字符。
                如果不用 AI 视频生成，可直接导出脚本到剪映手动剪辑，无需配置此 Key。
              </p>
            </div>
          </div>
        </div>

        {/* ===== 万象推演引擎 ===== */}
        <div id="wanxiang" className="space-card rounded-2xl p-6 scroll-mt-24">
          <h2 className="font-mono text-lg font-bold mb-1 flex items-center gap-2">
            <Network size={20} className="text-[var(--star)]" />
            万象推演引擎
          </h2>
          <p className="text-xs text-muted-foreground mb-2">
            基于 MiroFish 多智能体框架，运行在 Docker 容器中
          </p>
          <div className="flex items-center gap-2 mb-5 text-[11px] flex-wrap">
            <span className="px-2 py-0.5 rounded bg-[var(--star)]/10 text-[var(--star)]">万象推演 · 多智能体预测</span>
            <span className="px-2 py-0.5 rounded bg-[var(--star)]/10 text-[var(--star)]">万象推演 · AI 深度分析</span>
            <span className="px-2 py-0.5 rounded bg-[var(--star)]/10 text-[var(--star)]">万象推演 · 历史推演</span>
          </div>

          {/* New features */}
          <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-card-border mb-5 space-y-1.5">
            <h3 className="text-xs font-bold">万象推演支持的功能</h3>
            <div className="grid gap-1 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="text-[var(--star)] shrink-0">多智能体推演</span>
                <span>可配置智能体名称和角色，支持 8 种预设角色模板</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--star)] shrink-0">AI 深度分析</span>
                <span>推演结束后，AI 自动分析关键转折点、风险因素和行动建议（使用上方 AI 文本 API）</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--star)] shrink-0">历史推演</span>
                <span>推演结果自动保存到数据库，支持查看和删除历史记录</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--star)] shrink-0">导出 Markdown</span>
                <span>支持将推演报告导出为 Markdown 文件下载</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-elevated)] border border-card-border">
              <div className={`w-2.5 h-2.5 rounded-full ${hasWanxiang ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]" : "bg-muted-foreground/40"}`} />
              <div>
                <p className="text-sm font-medium">
                  {hasWanxiang ? "服务已连接" : "服务未启动"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {hasWanxiang
                    ? `后端地址：${process.env.WANXIANG_URL}`
                    : "需要启动 MiroFish Docker 容器"}
                </p>
              </div>
            </div>

            {/* Setup instructions */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold">部署步骤</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-card-border">
                  <p className="text-muted-foreground mb-1.5">
                    <span className="text-[var(--star)] font-medium">1. 拉取并启动容器</span>
                  </p>
                  <code className="block p-2 rounded bg-black/30 font-mono text-[11px] text-[var(--cyan)] overflow-x-auto whitespace-pre">
{`docker run -d --name mirofish \\
  -p 5001:5001 -p 3000:3000 \\
  -e LLM_API_KEY=你的Key \\
  -e LLM_BASE_URL=你的端点 \\
  -e LLM_MODEL_NAME=deepseek-chat \\
  ghcr.io/666ghj/mirofish:latest`}
                  </code>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-card-border">
                  <p className="text-muted-foreground mb-1.5">
                    <span className="text-[var(--star)] font-medium">2. 配置环境变量</span>
                  </p>
                  <p className="text-muted-foreground text-[11px] mb-1.5">
                    在项目 <code className="px-1 py-0.5 rounded bg-black/30 font-mono text-[10px]">.env</code> 中添加万象推演后端地址：
                  </p>
                  <code className="block p-2 rounded bg-black/30 font-mono text-[11px] text-[var(--cyan)] overflow-x-auto">
{`WANXIANG_URL=http://localhost:5001`}
                  </code>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-card-border">
                  <p className="text-muted-foreground mb-1.5">
                    <span className="text-[var(--star)] font-medium">3. MiroFish 所需环境变量</span>
                  </p>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-mono">LLM_API_KEY</span>
                      <span className="text-muted-foreground">AI API Key（必填）</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-mono">LLM_BASE_URL</span>
                      <span className="text-muted-foreground">AI API 端点（必填）</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-mono">LLM_MODEL_NAME</span>
                      <span className="text-muted-foreground">模型名，如 deepseek-chat</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-mono">ZEP_API_KEY</span>
                      <span className="text-muted-foreground">Zep 记忆层 Key（可选）</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--accent)] border border-card-border">
              <p className="text-xs text-muted-foreground">
                <span className="text-[var(--star)] font-medium">说明：</span>
                万象推演为可选模块，不影响其他功能。
                MiroFish 引擎自动使用你配置的 AI Key 驱动多智能体对话。
                首次启动约需 1-2 分钟冷启动。
              </p>
            </div>
          </div>
        </div>

        {/* ===== Profile ===== */}
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
