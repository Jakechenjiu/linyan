"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, Search, Shield, Compass, Wand2, MessageSquare, Trash2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const quickActions = [
  { id: "review", label: "检查问题", icon: <Shield size={12} />, prompt: "请检查当前章节有没有逻辑漏洞、AI味问题或需要改进的地方。" },
  { id: "suggest", label: "下一步建议", icon: <Compass size={12} />, prompt: "根据当前剧情和大纲，接下来应该怎么写？给我3个方向。" },
  { id: "rewrite", label: "帮我改这段", icon: <Wand2 size={12} />, prompt: "分析当前正文，指出问题并直接修改。" },
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
  onSave: () => Promise<void>;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Message = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    setStreamingText("");

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch(`/api/novels/${novelId}/ai-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId,
          message: text.trim(),
          bodyText: chapterBody,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
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
                // Finished
              }
            } catch {}
          }
        }
      }

      const aiMsg: Message = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        role: "assistant",
        content: streamingText || result,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setStreamingText("");
    } catch (e: unknown) {
      if (!(e instanceof Error && e.name === "AbortError")) {
        const errMsg: Message = {
          id: Math.random().toString(36).slice(2) + Date.now().toString(36),
          role: "assistant",
          content: `错误: ${e instanceof Error ? e.message : "未知错误"}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } finally {
      setStreaming(false);
      controllerRef.current = null;
      setStreamingText("");
    }
  };

  const handleStop = () => {
    controllerRef.current?.abort();
    setStreaming(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !streaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-[var(--cyan)]" />
            </div>
            <h3 className="font-mono text-base font-bold mb-2">AI 助手</h3>
            <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
              {chapterId
                ? "讨论剧情、分析角色、审查正文、获取建议"
                : "选择一个章节开始对话"}
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--cyan)] text-[#0a0e17] rounded-br-md"
                      : "bg-[var(--accent)] text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {streaming && streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl bg-[var(--accent)] text-foreground rounded-bl-md text-[13px] leading-relaxed">
                  {streamingText}
                  <span className="inline-block w-1.5 h-4 bg-[var(--cyan)] ml-0.5 animate-pulse" />
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
                disabled={streaming}
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
            placeholder={chapterId ? "和 AI 讨论剧情、分析角色、审查正文…" : "先选择一个章节…"}
            rows={1}
            className="flex-1 bg-transparent text-[13px] resize-none focus:outline-none placeholder:text-muted-foreground min-h-[24px] max-h-[100px] px-1"
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 100) + "px";
            }}
          />
          {streaming ? (
            <button
              onClick={handleStop}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <Loader2 size={14} className="animate-spin" />
            </button>
          ) : (
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
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
