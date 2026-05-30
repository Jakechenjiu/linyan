"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, RotateCcw, Wand2, BookOpen, Lightbulb } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

const quickActions: QuickAction[] = [
  { id: "write-next", label: "写下一段", icon: <Sparkles size={12} />, prompt: "请继续写下一段内容" },
  { id: "describe", label: "加描写", icon: <Wand2 size={12} />, prompt: "请为当前场景增加环境和感官描写" },
  { id: "dialogue", label: "改对话", icon: <BookOpen size={12} />, prompt: "请把对话改得更口语化、更有潜台词" },
  { id: "brainstorm", label: "灵感", icon: <Lightbulb size={12} />, prompt: "请给出接下来3个可能的故事发展方向" },
  { id: "rewrite", label: "润色", icon: <RotateCcw size={12} />, prompt: "请润色最近的段落，提升文字质感" },
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
      id: crypto.randomUUID(),
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
      const res = await fetch(`/api/novels/${novelId}/chat-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId,
          message: text.trim(),
          bodyText: chapterBody,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
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
      let bodyUpdate = "";
      let isBodyUpdate = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        // Parse SSE-style events
        const lines = (result + chunk).split("\n");
        result = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "text") {
                bodyUpdate += data.content;
                setStreamingText(bodyUpdate);
                onBodyChange(bodyUpdate);
                isBodyUpdate = true;
              } else if (data.type === "message") {
                setStreamingText(data.content);
              } else if (data.type === "done") {
                // Final body update
                if (data.body) {
                  onBodyChange(data.body);
                  await onSave();
                }
              }
            } catch {}
          }
        }
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: isBodyUpdate ? "已修改正文" : streamingText || "处理完成",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setStreamingText("");
    } catch (e: unknown) {
      if (!(e instanceof Error && e.name === "AbortError")) {
        const errMsg: Message = {
          id: crypto.randomUUID(),
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
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && !streaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-[var(--cyan)]" />
            </div>
            <h3 className="font-mono text-lg font-bold mb-2">开始创作</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {chapterId
                ? "告诉 AI 你想怎么修改当前章节，或使用下方快捷操作"
                : "选择一个章节开始写作，或让 AI 帮你创建新章节"}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
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
                <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-[var(--accent)] text-foreground rounded-bl-md text-sm leading-relaxed">
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
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => sendMessage(action.prompt)}
              disabled={streaming || !chapterId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-[var(--accent)] border border-card-border text-muted-foreground hover:text-foreground hover:border-[var(--cyan)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-4">
        <div className="flex items-end gap-2 p-3 rounded-2xl bg-[var(--accent)] border border-card-border focus-within:border-[var(--cyan)] transition-colors">
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
            placeholder={chapterId ? "告诉 AI 怎么修改…" : "先选择一个章节…"}
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground min-h-[24px] max-h-[120px]"
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
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
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--cyan)] text-[#0a0e17] hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
