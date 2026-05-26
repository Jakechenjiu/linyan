"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send, Loader2, Sparkles, ArrowRight } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWizard() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [novelId, setNovelId] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startedRef = useRef(false);

  const sendMessage = async (text: string) => {
    if (loading || finalized) return;
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/novels/create-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "NO_API_KEY") {
          setMessages([...newMessages, {
            role: "assistant",
            content: "要使用 AI 创作功能，需要先配置你的 API Key。\n\n请在设置页面中添加你的 DeepSeek API Key（获取地址：platform.deepseek.com），然后回到这里继续创作。",
          }]);
        } else {
          setMessages([...newMessages, { role: "assistant", content: `抱歉，出了点问题：${data.error || "请重试"}` }]);
        }
        setLoading(false);
        return;
      }

      if (data.finalized) {
        setMessages([...newMessages, { role: "assistant", content: data.message || "设定已生成！" }]);
        setFinalized(true);
        setNovelId(data.novelId);
      } else {
        const reply = data.message || "（AI 返回了空回复，请重试）";
        setMessages([...newMessages, { role: "assistant", content: reply }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "网络异常，请检查连接后重试" }]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Start the conversation (once)
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      sendMessage("你好，我想创作一部新作品");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
  };

  const handleEnterStudio = () => {
    if (novelId) {
      router.push(`/workspace/star/${novelId}`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-2xl mx-auto">
      {/* Chat header */}
      <div className="shrink-0 mb-4">
        <h2 className="font-mono text-xl font-bold flex items-center gap-2">
          <Sparkles size={20} className="text-[var(--cyan)]" />
          灵砚创作助手
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {finalized ? "设定已生成！进入工作室开始创作。" : "和我聊聊你想写的故事，我会帮你完善设定并创建新书。"}
        </p>
      </div>

      {/* Chat area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--cyan)] text-[#0a0e17]"
                  : "bg-[var(--accent)] border border-card-border text-foreground"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--accent)] border border-card-border rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-bounce" style={{ animationDelay: "0s" }} />
                  <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
                <span className="text-xs text-muted-foreground">灵砚助手正在思考…</span>
              </div>
            </div>
          </div>
        )}

        {/* Enter studio button */}
        {finalized && (
          <div className="flex justify-center pt-4 pb-2">
            <button
              onClick={handleEnterStudio}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all animate-glow-pulse"
              style={{ color: "#0a0e17" }}
            >
              进入工作室 <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Input area */}
      {!finalized && (
        <form onSubmit={handleSubmit} className="shrink-0 mt-4 flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={loading ? "灵砚助手正在回复…" : "说说你的故事想法…"}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--accent)] border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-3 rounded-xl bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-30"
            style={{ color: "#0a0e17" }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      )}
    </div>
  );
}
