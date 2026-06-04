"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Sparkles, Shield, Compass, Wand2, MessageSquare, Wrench, Check, Target, Zap } from "lucide-react";

interface ToolCall {
  tool: string;
  success: boolean;
  summary: string;
}

interface PipelineProgress {
  stage: string;
  message: string;
  done: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  modifiedBody?: string;
  pipelineProgress?: PipelineProgress[];
  timestamp: number;
}

const quickActions = [
  { id: "write", label: "写下一章", icon: <Zap size={12} />, prompt: "写下一章" },
  { id: "suggest", label: "下一步建议", icon: <Compass size={12} />, prompt: "根据当前剧情和大纲，接下来应该怎么写？给我3个具体方向。" },
  { id: "review", label: "检查问题", icon: <Shield size={12} />, prompt: "请检查当前章节有没有逻辑漏洞、AI味问题或需要改进的地方。列出具体问题。" },
  { id: "rewrite", label: "帮我改这段", icon: <Wand2 size={12} />, prompt: "分析当前正文，找出问题并直接修改。告诉我改了什么。" },
  { id: "character", label: "角色分析", icon: <MessageSquare size={12} />, prompt: "分析当前章节中角色的表现，检查动机、性格一致性。" },
];

const PIPELINE_STAGES = [
  { key: "plan", label: "规划意图", icon: "🎯" },
  { key: "compose", label: "编排上下文", icon: "📋" },
  { key: "write", label: "写作", icon: "✍️" },
  { key: "observe", label: "提取事实", icon: "👁️" },
  { key: "reflect", label: "更新真相", icon: "🔄" },
  { key: "audit", label: "审计", icon: "🔍" },
  { key: "revise", label: "修订", icon: "🔧" },
  { key: "save", label: "保存", icon: "💾" },
];

export default function ChatPanel({
  novelId,
  chapterId,
  chapterBody,
  onBodyChange,
  onSave,
  onPipelineResult,
}: {
  novelId: string;
  chapterId: string | null;
  chapterBody: string;
  onBodyChange: (body: string) => void;
  onSave: (bodyOverride?: string) => Promise<void>;
  onPipelineResult?: (result: any) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<string | null>(null);
  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);
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

    // 检测是否是管线触发
    const triggers = ["写第", "写一章", "续写", "继续写", "生成章节", "创作", "开始写", "帮我写", "写下一章", "下一章"];
    const isPipeline = triggers.some((t) => text.includes(t));
    if (isPipeline) {
      setPipelineStage("plan");
    }

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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "请求失败");
      }

      const aiMsg: Message = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        role: "assistant",
        content: data.response || "处理完成",
        toolCalls: data.toolCalls || [],
        modifiedBody: data.modifiedBody,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // 通知管线结果
      if (data.toolCalls?.some((tc: any) => tc.tool === "chapter_pipeline")) {
        onPipelineResult?.(data);
      }

      setLastFailedInput(null);

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
      // Store the failed message for retry
      setLastFailedInput(text);
    } finally {
      setLoading(false);
      setPipelineStage(null);
    }
  };

  // 处理快捷键
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave();
    }
  }, [onSave]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
                <p>💡 快捷指令：写下一章 · 检查问题 · 下一步建议 · 帮我改这段 · 角色分析</p>
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
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>

                  {/* Tool calls */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 ml-1">
                      {msg.toolCalls.map((tc, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                            tc.success
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          <Wrench size={9} />
                          {tc.tool === "chapter_pipeline" ? "多Agent管线" : tc.tool}
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

                  {/* Retry button for errors */}
                  {msg.role === "assistant" && msg.content.startsWith("错误:") && lastFailedInput && (
                    <button
                      onClick={() => sendMessage(lastFailedInput)}
                      className="ml-1 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-[var(--cyan)] bg-[var(--cyan)]/10 hover:bg-[var(--cyan)]/20 transition-colors"
                    >
                      重试
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Pipeline progress indicator */}
            {loading && pipelineStage && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl bg-[var(--accent)] border border-card-border rounded-bl-md max-w-[85%]">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 size={12} className="animate-spin text-[var(--cyan)]" />
                    <span className="text-[11px] font-medium">多 Agent 管线执行中</span>
                  </div>
                  <div className="space-y-1">
                    {PIPELINE_STAGES.map((stage, i) => {
                      const currentIdx = PIPELINE_STAGES.findIndex((s) => s.key === pipelineStage);
                      const stageIdx = PIPELINE_STAGES.indexOf(stage);
                      const isActive = stage.key === pipelineStage;
                      const isDone = stageIdx < currentIdx;
                      return (
                        <div key={stage.key} className={`flex items-center gap-2 text-[10px] ${isActive ? "text-foreground" : isDone ? "text-emerald-400/70" : "text-muted-foreground/40"}`}>
                          <span className="w-4 text-center">{isDone ? "✓" : isActive ? "●" : "○"}</span>
                          <span>{stage.icon}</span>
                          <span>{stage.label}</span>
                          {isActive && <Loader2 size={9} className="animate-spin ml-auto" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Simple loading indicator (non-pipeline) */}
            {loading && !pipelineStage && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2.5 rounded-2xl bg-[var(--accent)] text-foreground rounded-bl-md text-[13px]">
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin text-[var(--cyan)]" /> 思考中…
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick Actions — always visible */}
      <div className="px-4 pb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => sendMessage(action.prompt)}
              disabled={loading || !chapterId}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[var(--accent)] border border-card-border text-muted-foreground hover:text-foreground hover:border-[var(--cyan)] transition-all disabled:opacity-30"
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-3">
        <div className="flex items-end gap-2 p-2 rounded-xl bg-[var(--accent)] border border-card-border focus-within:border-[var(--cyan)] transition-colors">
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
            className="flex-1 bg-transparent text-[13px] resize-none focus:outline-none placeholder:text-muted-foreground/50 min-h-[24px] max-h-[100px] px-1"
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 100) + "px";
            }}
          />
          {loading ? (
            <button
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--accent)] text-muted-foreground"
              disabled
            >
              <Loader2 size={14} className="animate-spin" />
            </button>
          ) : (
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || !chapterId}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--cyan)] text-[#0a0e17] hover:opacity-90 transition-all disabled:opacity-30"
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
