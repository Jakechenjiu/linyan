"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Sparkles, Loader2, Send, Wand2, Repeat, Globe, X, ChevronDown, Check } from "lucide-react";
import { saveContent } from "./actions";

interface Props {
  content: {
    id: string;
    title: string;
    body: string;
    platform: string;
    wordCount: number;
    status: string;
  };
}

const repurposeOptions = [
  { id: "long-to-short", label: "长文→摘要", desc: "压缩为300字精华" },
  { id: "text-to-script", label: "文章→口播", desc: "改编为60秒脚本" },
  { id: "article-to-xhs", label: "文章→小红书", desc: "种草笔记风格" },
  { id: "article-to-zhihu", label: "文章→知乎", desc: "专业回答格式" },
];

const platformOptions = [
  { id: "wechat", label: "公众号" },
  { id: "xiaohongshu", label: "小红书" },
  { id: "douyin", label: "抖音" },
  { id: "weibo", label: "微博" },
  { id: "zhihu", label: "知乎" },
  { id: "bilibili", label: "B站" },
];

export default function ContentEditor({ content }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(content.title);
  const [body, setBody] = useState(content.body);
  const [status, setStatus] = useState(content.status);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef({ title: content.title, body: content.body, status: content.status });

  // AI Chat state
  const [chatInput, setChatInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [showRepurpose, setShowRepurpose] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, streamingText]);

  const handleSave = async () => {
    setSaving(true);
    const formData = new FormData();
    formData.set("contentId", content.id);
    formData.set("title", title);
    formData.set("body", body);
    formData.set("status", status);
    await saveContent(formData);
    lastSavedRef.current = { title, body, status };
    setSaving(false);
    setSaved(true);
    router.refresh();
  };

  // Auto-save with debounce
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      if (title !== lastSavedRef.current.title || body !== lastSavedRef.current.body || status !== lastSavedRef.current.status) {
        setSaving(true);
        const formData = new FormData();
        formData.set("contentId", content.id);
        formData.set("title", title);
        formData.set("body", body);
        formData.set("status", status);
        await saveContent(formData);
        lastSavedRef.current = { title, body, status };
        setSaving(false);
        setSaved(true);
      }
    }, 2000);
  }, [title, body, status, content.id]);

  // Watch for changes and trigger auto-save
  useEffect(() => {
    if (title !== lastSavedRef.current.title || body !== lastSavedRef.current.body || status !== lastSavedRef.current.status) {
      setSaved(false);
      triggerAutoSave();
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [title, body, status, triggerAutoSave]);

  const sendChat = async (message: string, mode: string = "chat", targetPlatform?: string) => {
    if (!message.trim() || streaming) return;
    setChatHistory((prev) => [...prev, { role: "user", text: message.trim() }]);
    setChatInput("");
    setStreaming(true);
    setStreamingText("");
    setError(null);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch(`/api/photon/content-chat/${content.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), title, body, mode, targetPlatform }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "请求失败");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = (result + chunk).split("\n");
        result = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "text") {
                setStreamingText(data.content);
              } else if (data.type === "done") {
                // Parse the result to extract title and body
                const text = streamingText || data.content;
                const parts = text.split("\n\n");
                if (parts.length >= 2) {
                  const newTitle = parts[0].replace(/^#\s*/, "").trim();
                  const newBody = parts.slice(1).join("\n\n").trim();
                  setTitle(newTitle);
                  setBody(newBody);
                } else {
                  setBody(text);
                }
                setChatHistory((prev) => [...prev, { role: "ai", text: "已更新内容" }]);
                await handleSave();
              }
            } catch {}
          }
        }
      }
    } catch (e: unknown) {
      if (!(e instanceof Error && e.name === "AbortError")) {
        setError(e instanceof Error ? e.message : "未知错误");
        setChatHistory((prev) => [...prev, { role: "ai", text: `错误: ${e instanceof Error ? e.message : "未知错误"}` }]);
      }
    } finally {
      setStreaming(false);
      controllerRef.current = null;
      setStreamingText("");
    }
  };

  const handleRepurpose = (optionId: string) => {
    sendChat(optionId, "repurpose");
    setShowRepurpose(false);
  };

  const handleMultiPlatform = (platform: string) => {
    sendChat(`适配到${platform}`, "multiplatform", platform);
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-card-border shrink-0">
        <Link href="/workspace/photon" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors">
          <ArrowLeft size={14} /> 返回
        </Link>
        <div className="flex items-center gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="px-2 py-1 rounded-lg bg-[var(--accent)] border border-card-border text-[11px] focus:outline-none">
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
          </select>
          <span className="text-[10px] text-muted-foreground">{body.trim().length} 字</span>
          {saved ? (
            <span className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-emerald-400">
              <Check size={12} /> 已保存
            </span>
          ) : saving ? (
            <span className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-muted-foreground">
              <Loader2 size={12} className="animate-spin" /> 保存中…
            </span>
          ) : (
            <button type="button" onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--cyan)] text-[#0a0e17] hover:opacity-90 transition-all">
              <Save size={12} /> 保存
            </button>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Content Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full font-mono text-2xl font-bold bg-transparent border-b border-card-border pb-3 focus:outline-none focus:border-[var(--cyan)] transition-colors"
              placeholder="文章标题…"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={Math.max(20, body.split("\n").length + 6)}
              className="w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none"
              placeholder="内容正文…"
            />
          </div>
        </div>

        {/* Right: AI Chat Panel */}
        <div className="w-80 border-l border-card-border flex flex-col shrink-0">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatHistory.length === 0 && !streaming ? (
              <div className="text-center py-8">
                <Sparkles size={24} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[11px] text-muted-foreground">告诉 AI 怎么修改文章</p>
              </div>
            ) : (
              <>
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`text-[11px] px-3 py-1.5 rounded-lg ${
                    msg.role === "user" ? "bg-[var(--cyan)]/10 text-[var(--cyan)] ml-6" : "bg-[var(--accent)] text-muted-foreground mr-6"
                  }`}>
                    <span className="font-medium">{msg.role === "user" ? "你" : "AI"}：</span>{msg.text}
                  </div>
                ))}
                {streaming && streamingText && (
                  <div className="text-[11px] px-3 py-1.5 rounded-lg bg-[var(--accent)] text-muted-foreground mr-6">
                    {streamingText.slice(0, 100)}…
                    <span className="inline-block w-1 h-3 bg-[var(--cyan)] ml-0.5 animate-pulse" />
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          <div className="px-3 pb-2 space-y-1.5">
            {/* Repurpose */}
            <div className="relative">
              <button onClick={() => setShowRepurpose(!showRepurpose)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--accent)] border border-card-border text-muted-foreground hover:text-foreground transition-colors">
                <span className="flex items-center gap-1.5"><Repeat size={11} /> 内容改写</span>
                <ChevronDown size={11} />
              </button>
              {showRepurpose && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-[var(--background)] border border-card-border rounded-lg shadow-lg overflow-hidden z-10">
                  {repurposeOptions.map((opt) => (
                    <button key={opt.id} onClick={() => handleRepurpose(opt.id)}
                      className="w-full text-left px-3 py-2 text-[11px] hover:bg-[var(--accent)] transition-colors">
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-muted-foreground ml-1.5">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Multi-platform */}
            <div className="flex flex-wrap gap-1">
              {platformOptions.filter((p) => p.id !== content.platform).slice(0, 4).map((p) => (
                <button key={p.id} onClick={() => handleMultiPlatform(p.id)}
                  className="px-2 py-1 rounded text-[10px] font-medium bg-[var(--accent)] border border-card-border text-muted-foreground hover:text-foreground hover:border-[var(--cyan)] transition-all">
                  <Globe size={9} className="inline mr-0.5" /> {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat input */}
          <div className="p-3 border-t border-card-border">
            <div className="flex items-center gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(chatInput); } }}
                placeholder="告诉AI怎么改…"
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-[var(--accent)] border border-card-border text-[11px] focus:outline-none focus:border-[var(--cyan)] transition-colors"
              />
              {streaming ? (
                <button onClick={() => controllerRef.current?.abort()}
                  className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
                  <Loader2 size={12} className="animate-spin" />
                </button>
              ) : (
                <button onClick={() => sendChat(chatInput)} disabled={!chatInput.trim()}
                  className="p-1.5 rounded-lg bg-[var(--cyan)] text-[#0a0e17] disabled:opacity-40">
                  <Send size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 text-[11px] text-red-400 border-t border-card-border">{error}</div>
      )}
    </div>
  );
}
