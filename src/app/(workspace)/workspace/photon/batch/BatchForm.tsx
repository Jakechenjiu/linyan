"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { loadBuiltInTemplates } from "@/lib/templates";

const platforms = [
  { id: "douyin", label: "抖音" },
  { id: "wechat", label: "公众号" },
  { id: "xiaohongshu", label: "小红书" },
  { id: "weibo", label: "微博" },
  { id: "zhihu", label: "知乎" },
  { id: "bilibili", label: "B站" },
];

const styles = [
  { id: "mix", label: "混剪", desc: "画面多变，节奏快" },
  { id: "talk", label: "口播", desc: "主持人出镜讲解" },
  { id: "image", label: "图文", desc: "文字+静态画面" },
];

interface Props {
  initialError?: string;
}

export default function BatchForm({ initialError }: Props) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("mix");
  const [platform, setPlatform] = useState("douyin");
  const [templateId, setTemplateId] = useState("");
  const [error, setError] = useState(initialError || "");
  const [loading, setLoading] = useState(false);

  const templates = loadBuiltInTemplates();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    try {
      // If template selected, prepend its context to the topic
      let finalTopic = topic.trim();
      const tpl = templateId ? templates.find((t) => t.id === templateId) : null;
      if (tpl) {
        finalTopic = `${tpl.name}：${tpl.description}\n${finalTopic}`;
      }
      const res = await fetch("/api/photon/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: finalTopic, style, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成失败");
      router.push(`/workspace/photon/studio/${data.projectId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-wide">AI 短视频工厂</h1>
        <p className="text-sm text-muted-foreground mt-1">输入主题，AI 自动生成分镜脚本并跳转到视频工作室</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-card rounded-2xl p-6 space-y-6">
        {/* Topic */}
        <div>
          <label className="text-sm font-medium mb-2 block">视频主题</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="输入你要创作的视频主题，越具体效果越好…"
            required
            className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors"
          />
        </div>

        {/* Style */}
        <div>
          <label className="text-sm font-medium mb-2 block">视频风格</label>
          <div className="grid grid-cols-3 gap-2">
            {styles.map((s) => (
              <label
                key={s.id}
                className={`p-3 rounded-xl text-center cursor-pointer transition-all border ${
                  style === s.id
                    ? "border-[var(--nebula)] bg-[var(--nebula-soft)]"
                    : "border-card-border hover:border-[var(--nebula)] hover:bg-[var(--accent)]"
                }`}
              >
                <input
                  type="radio"
                  name="style"
                  value={s.id}
                  checked={style === s.id}
                  onChange={(e) => setStyle(e.target.value)}
                  className="hidden"
                />
                <div className="text-xs font-medium">{s.label}</div>
                <div className="text-[10px] text-muted-foreground">{s.desc}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div>
          <label className="text-sm font-medium mb-2 block">目标平台</label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <label
                key={p.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                  platform === p.id
                    ? "border-[var(--cyan)] bg-[var(--cyan-soft)]"
                    : "border-card-border hover:border-[var(--cyan)]"
                }`}
              >
                <input
                  type="radio"
                  name="platform"
                  value={p.id}
                  checked={platform === p.id}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="accent-[var(--cyan)]"
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        {/* Template */}
        <div>
          <label className="text-sm font-medium mb-2 block">参考模板（可选）</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-card-border text-sm focus:outline-none focus:border-[var(--cyan)] transition-colors"
          >
            <option value="">自由生成</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.description}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50"
          style={{ color: "#0a0e17" }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? "生成中…" : "生成分镜脚本"}
        </button>
        <p className="text-xs text-muted-foreground">AI 将生成抖音风格分镜脚本，约需 10-30 秒</p>
      </form>
    </div>
  );
}
