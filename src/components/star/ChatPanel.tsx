"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, Shield, Compass, Wand2, MessageSquare, Wrench, Check } from "lucide-react";

interface ToolCall {
  tool: string;
  success: boolean;
  summary: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  modifiedBody?: string;
  timestamp: number;
}

const quickActions = [
  { id: "review", label: "检查问题", icon: <Shield size={12} />, prompt: "请检查当前章节有没有逻辑漏洞、AI味问题或需要改进的地方。列出具体问题。" },
  { id: "suggest", label: "下一步建议", icon: <Compass size={12} />, prompt: "根据当前剧情和大纲，接下来应该怎么写？给我3个具体方向。" },
  { id: "rewrite", label: "帮我改这段", icon: <Wand2 size={12} />, prompt: "分析当前正文，找出问题并直接修改。告诉我改了什么。" },
  { id: "character", label: "角色分析", icon: <MessageSquare size={12} />, prompt: "分析当前章节中角色的表现，检查动机、性格一致性。" },
];

export default function ChatPanel({
  novelId,
  chapterId,
  chapterBody,
  onBodyChange,
  onSave,
}: {
  novelId: string;
  chapterId: string | null;
  chapterBody: string;
  onBodyChange: (body: string) => void;
  onSave: (bodyOverride?: string) => Promise<void>;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || !chapterId) return;
    const userMsg: Message = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    

    try {
      const res = await fetch(`/api/novels/${novelId}/ai-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId,
          message: text.trim(),
          bodyText: chapterBody,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "请求失败");
      }

      const data = await res.json();

      const aiMsg: Message = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        role: "assistant",
        content: data.response || "处理完成",
        toolCalls: data.toolCalls || [],
        modifiedBody: data.modifiedBody,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // 自动应用修改后的正文
      if (data.modifiedBody) {
        onBodyChange(data.modifiedBody);
        await onSave(data.modifiedBody);
      }
    } catch (e: unknown) {
      const errMsg: Message = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        role: "assistant",
        content: `错误: ${e instanceof Error ? e.message : "未知错误"}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-[var(--cyan)]" />
            </div>
            <h3 className="font-mono text-base font-bold mb-2">AI 写作助手</h3>
            <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed mb-4">
              {chapterId
                ? "在这里和 AI 讨论你的小说。AI 可以分析剧情、检查问题、给出建议，也可以直接帮你修改正文。"
                : "选择左侧章节列表中的一个章节，开始和 AI 对话。"}
            </p>
            {chapterId && (
              <div className="text-[10px] text-muted-foreground/60 space-y-1">
                <p>💡 快捷指令：检查问题 · 下一步建议 · 帮我改这段 · 角色分析</p>
                <p>✏️ 修改正文后，右侧会自动更新并保存</p>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] space-y-2">
                  {/* Message bubble */}
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[var(--cyan)] text-[#0a0e17] rounded-br-md"
                        : "bg-[var(--accent)] text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Tool calls */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 ml-1">
                      {msg.toolCalls.map((tc, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                            tc.success
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          <Wrench size={9} />
                          {tc.tool}: {tc.summary}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Modified body indicator */}
                  {msg.modifiedBody && (
                    <div className="ml-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Check size={11} className="text-emerald-400" />
                      <span className="text-[11px] text-emerald-400">正文已更新并保存</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2.5 rounded-2xl bg-[var(--accent)] text-foreground rounded-bl-md text-[13px]">
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" /> 思考中…
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {messages.length === 0 && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => sendMessage(action.prompt)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-[var(--accent)] border border-card-border text-muted-foreground hover:text-foreground hover:border-[var(--cyan)] transition-all disabled:opacity-40"
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-3">
        <div className="flex items-end gap-2 p-2.5 rounded-2xl bg-[var(--accent)] border border-card-border focus-within:border-[var(--cyan)] transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder={chapterId ? "讨论剧情、分析角色、修改正文…" : "先选择一个章节…"}
            rows={1}
            className="flex-1 bg-transparent text-[13px] resize-none focus:outline-none placeholder:text-muted-foreground min-h-[24px] max-h-[100px] px-1"
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 100) + "px";
            }}
          />
          {loading ? (
            <button
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-red-500/20 text-red-400"
              disabled
            >
              <Loader2 size={14} className="animate-spin" />
            </button>
          ) : (
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || !chapterId}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--cyan)] text-[#0a0e17] hover:opacity-90 transition-all disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
