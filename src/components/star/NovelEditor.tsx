"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Save, Sparkles, Loader2, Eye, Stars, ChevronDown, ChevronRight, FileText, AlertTriangle, Zap, Users, Check } from "lucide-react";
import { saveChapter } from "./actions";

interface ReviewResult {
  overall: string;
  summary: string;
  issues: { severity: string; category: string; location: string; description: string; fixHint: string }[];
  strengths: string[];
}

const severityColors: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#f0e68c",
  low: "#6b7280",
};

const categoryLabels: Record<string, string> = {
  character_consistency: "角色一致性",
  setting_consistency: "设定一致性",
  narrative_coherence: "叙事连贯性",
  pacing: "节奏",
  ai_flavor: "AI味检测",
};

interface Props {
  novelId: string;
  chapter: {
    id: string;
    title: string;
    body: string;
    wordCount: number;
    order: number;
    factSnapshot?: string | null;
    outline?: { id: string; summary: string | null } | null;
  };
}

export default function NovelEditor({ novelId, chapter }: Props) {
  const [title, setTitle] = useState(chapter.title);
  const [body, setBody] = useState(chapter.body);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true); // 已保存状态
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [aiMode, setAiMode] = useState<string>("continue");
  const [showFacts, setShowFacts] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef({ title: chapter.title, body: chapter.body });

  const factData = chapter.factSnapshot ? JSON.parse(chapter.factSnapshot) as {
    newFacts?: string[];
    stateChanges?: string[];
    openHooks?: string[];
    characterMoments?: Record<string, string>;
  } : null;

  const handleSave = async () => {
    setSaving(true);
    await saveChapter(chapter.id, title, body);
    lastSavedRef.current = { title, body };
    setSaving(false);
    setSaved(true);
  };

  // Auto-save with debounce
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      if (title !== lastSavedRef.current.title || body !== lastSavedRef.current.body) {
        setSaving(true);
        await saveChapter(chapter.id, title, body);
        lastSavedRef.current = { title, body };
        setSaving(false);
        setSaved(true);
      }
    }, 2000); // 2秒无操作后自动保存
  }, [title, body, chapter.id]);

  // Watch for changes and trigger auto-save
  useEffect(() => {
    if (title !== lastSavedRef.current.title || body !== lastSavedRef.current.body) {
      setSaved(false);
      triggerAutoSave();
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      // 离开页面时立即保存
      if (title !== lastSavedRef.current.title || body !== lastSavedRef.current.body) {
        saveChapter(chapter.id, title, body);
      }
    };
  }, [title, body, triggerAutoSave, chapter.id]);

  // 浏览器关闭/刷新时提示
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (title !== lastSavedRef.current.title || body !== lastSavedRef.current.body) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [title, body]);

  const handleAiGenerate = async () => {
    setStreaming(true);
    setError(null);
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch(`/api/novels/${novelId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: chapter.id, direction: direction || undefined }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "生成失败");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      const newBody = body;
      let appendText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        appendText += chunk;
        // Detect streamed errors
        if (appendText.startsWith("[ERROR]")) {
          setError(appendText.replace("[ERROR] ", ""));
          setStreaming(false);
          return;
        }
        setBody(newBody + appendText);
        // Auto-scroll textarea
        if (textareaRef.current) {
          textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
      }

      // Auto-save after generation
      await saveChapter(chapter.id, title, newBody + appendText);
    } catch (e: unknown) {
      if (!(e instanceof Error && e.name === "AbortError")) {
        setError((e instanceof Error ? e.message : null) || "生成失败");
      }
    } finally {
      setStreaming(false);
      controllerRef.current = null;
    }
  };

  const handleStop = () => {
    controllerRef.current?.abort();
    setStreaming(false);
  };

  const getSelectedText = () => {
    if (!textareaRef.current) return "";
    const { selectionStart, selectionEnd } = textareaRef.current;
    if (selectionStart === selectionEnd) return "";
    return body.substring(selectionStart, selectionEnd);
  };

  const handleAiMode = async () => {
    setStreaming(true);
    setError(null);
    const controller = new AbortController();
    controllerRef.current = controller;

    const selected = getSelectedText();

    try {
      const res = await fetch(`/api/novels/${novelId}/ai-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: chapter.id,
          mode: aiMode,
          selectedText: selected || undefined,
          instruction: direction || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "生成失败");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;

        if (result.startsWith("[ERROR]")) {
          setError(result.replace("[ERROR] ", ""));
          setStreaming(false);
          return;
        }

        if (aiMode === "brainstorm") {
          // Brainstorm replaces a special area, not the body
          setBody(body + "\n\n---\n💡 灵感建议：\n" + result);
        } else if (aiMode === "rewrite" && selected) {
          // Replace selected text
          const before = body.substring(0, body.indexOf(selected));
          const after = body.substring(body.indexOf(selected) + selected.length);
          setBody(before + result + after);
        } else {
          // Continue/describe/expand: append
          setBody(body + result);
        }

        if (textareaRef.current) {
          textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
      }

      await saveChapter(chapter.id, title, body + (aiMode === "rewrite" && selected ? "" : result));
    } catch (e: unknown) {
      if (!(e instanceof Error && e.name === "AbortError")) {
        setError((e instanceof Error ? e.message : null) || "生成失败");
      }
    } finally {
      setStreaming(false);
      controllerRef.current = null;
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim() || streaming) return;
    const msg = chatMessage.trim();
    setChatMessage("");
    setChatHistory((prev) => [...prev, { role: "user", text: msg }]);
    setStreaming(true);
    setError(null);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch(`/api/novels/${novelId}/ai-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: chapter.id,
          mode: "chat",
          bodyText: body,
          instruction: msg,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "生成失败");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        setBody(result);
        if (textareaRef.current) {
          textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
      }

      setChatHistory((prev) => [...prev, { role: "ai", text: "已修改正文" }]);
      await saveChapter(chapter.id, title, result);
    } catch (e: unknown) {
      if (!(e instanceof Error && e.name === "AbortError")) {
        setError((e instanceof Error ? e.message : null) || "对话失败");
        setChatHistory((prev) => [...prev, { role: "ai", text: `错误: ${e instanceof Error ? e.message : "未知错误"}` }]);
      }
    } finally {
      setStreaming(false);
      controllerRef.current = null;
    }
  };

  const handleRewriteByOutline = async () => {
    const outlineId = chapter.outline?.id;
    if (!outlineId) return;

    setStreaming(true);
    setError(null);
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch(`/api/novels/${novelId}/auto-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outlineId }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "生成失败");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let newBody = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const data = JSON.parse(raw);
            if (data.type === "text") {
              newBody += data.content;
              setBody(newBody);
            } else if (data.type === "error") {
              setError(data.message);
              setStreaming(false);
              return;
            }
          } catch {}
        }
      }

      if (textareaRef.current) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }

      await saveChapter(chapter.id, title, newBody);
    } catch (e: unknown) {
      if (!(e instanceof Error && e.name === "AbortError")) {
        setError((e instanceof Error ? e.message : null) || "生成失败");
      }
    } finally {
      setStreaming(false);
      controllerRef.current = null;
    }
  };

  const handleReview = async () => {
    setReviewing(true);
    setReview(null);
    try {
      const res = await fetch(`/api/novels/${novelId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: chapter.id }),
      });
      if (!res.ok) throw new Error("审查失败");
      const data = await res.json();
      setReview(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setReviewing(false);
    }
  };

  const wordCount = body.trim().length;

  return (
    <div className="space-card rounded-2xl p-6">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full font-mono text-xl font-bold bg-transparent border-b border-card-border pb-2 mb-4 focus:outline-none focus:border-[var(--cyan)] transition-colors"
      />

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={Math.max(10, body.split("\n").length + 4)}
          className="w-full bg-[var(--accent)]/20 text-sm leading-relaxed resize-none rounded-lg p-4 border border-card-border focus:outline-none focus:border-[var(--cyan)] focus:bg-[var(--accent)]/40 transition-all cursor-text"
          placeholder="点击这里开始写作…"
          spellCheck={false}
        />
        {streaming && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--nebula)]/10 border border-[var(--nebula)]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--nebula)] animate-pulse" />
            <span className="text-[9px] text-[var(--nebula)]">生成中</span>
          </div>
        )}
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-card-border">
        <span className="text-xs text-muted-foreground">{body.trim().length} 字</span>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin" /> 保存中…
            </span>
          )}
          {!saving && saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Check size={12} /> 已保存
            </span>
          )}
          <button type="button" onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--cyan-soft)] text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-[#0a0e17] transition-all">
            <Save size={12} /> 保存
          </button>
        </div>
      </div>

      {/* Fact Snapshot */}
      {factData && (
        <div className="mt-3 rounded-xl border border-card-border overflow-hidden">
          <button
            onClick={() => setShowFacts(!showFacts)}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-[var(--accent)] transition-colors"
          >
            {showFacts ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <FileText size={12} /> 章节事实
          </button>
          {showFacts && (
            <div className="p-4 space-y-3 text-xs">
              {factData.newFacts && factData.newFacts.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 font-medium text-[var(--cyan)] mb-1"><Zap size={11} /> 新事实</p>
                  <ul className="space-y-0.5 ml-5">
                    {factData.newFacts.map((f: string, i: number) => <li key={i} className="text-muted-foreground">• {f}</li>)}
                  </ul>
                </div>
              )}
              {factData.stateChanges && factData.stateChanges.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 font-medium text-[var(--star)] mb-1"><AlertTriangle size={11} /> 状态变化</p>
                  <ul className="space-y-0.5 ml-5">
                    {factData.stateChanges.map((s: string, i: number) => <li key={i} className="text-muted-foreground">• {s}</li>)}
                  </ul>
                </div>
              )}
              {factData.openHooks && factData.openHooks.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 font-medium text-[var(--nebula)] mb-1"><Sparkles size={11} /> 未解伏笔</p>
                  <ul className="space-y-0.5 ml-5">
                    {factData.openHooks.map((h: string, i: number) => <li key={i} className="text-muted-foreground">• {h}</li>)}
                  </ul>
                </div>
              )}
              {factData.characterMoments && Object.keys(factData.characterMoments).length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 font-medium text-pink-400 mb-1"><Users size={11} /> 角色时刻</p>
                  <ul className="space-y-0.5 ml-5">
                    {Object.entries(factData.characterMoments).map(([name, moment]) => (
                      <li key={name} className="text-muted-foreground"><span className="text-foreground font-medium">{name}：</span>{moment as string}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chat History */}
      {chatHistory.length > 0 && (
        <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`text-[11px] px-3 py-1.5 rounded-lg ${
              msg.role === "user"
                ? "bg-[var(--nebula)]/10 text-[var(--nebula)] ml-8"
                : "bg-[var(--accent)] text-muted-foreground mr-8"
            }`}>
              <span className="font-medium">{msg.role === "user" ? "你" : "AI"}：</span>{msg.text}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-card-border">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{wordCount.toLocaleString()} 字</span>
          {streaming && (
            <span className="flex items-center gap-1.5 text-[10px] text-[var(--nebula)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--nebula)] animate-pulse" />
              AI 生成中…
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* AI Mode Selector */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--accent)] border border-card-border">
            {[
              { id: "chat", label: "对话", desc: "AI直接改正文" },
              { id: "continue", label: "续写", desc: "从光标继续写" },
              { id: "describe", label: "描写", desc: "加感官细节" },
              { id: "expand", label: "扩写", desc: "加对话动作" },
              { id: "rewrite", label: "改写", desc: "提升文字质感" },
              { id: "brainstorm", label: "灵感", desc: "给剧情方向" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setAiMode(m.id)}
                title={m.desc}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                  aiMode === m.id
                    ? "bg-[var(--nebula)] text-[#0a0e17]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {aiMode !== "chat" ? (
            <>
              <input
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                placeholder={aiMode === "brainstorm" ? "关注方向（可选）…" : "续写方向（可选）…"}
                className="w-36 px-2 py-1 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-[10px] placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors"
              />
              {streaming ? (
                <button type="button" onClick={handleStop}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                  <Loader2 size={12} className="animate-spin" /> 停止
                </button>
              ) : (
                <button type="button" onClick={handleAiMode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-card-border hover:border-[var(--nebula)] text-[var(--nebula)] transition-colors">
                  <Sparkles size={12} /> {aiMode === "continue" ? "AI 续写" : aiMode === "describe" ? "AI 描写" : aiMode === "expand" ? "AI 扩写" : aiMode === "rewrite" ? "AI 改写" : "AI 灵感"}
                </button>
              )}
            </>
          ) : (
            <>
              <input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                placeholder="告诉AI怎么改，如「把对话改得更口语化」…"
                className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-[var(--accent)] border border-card-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-[var(--cyan)] transition-colors"
              />
              {streaming ? (
                <button type="button" onClick={handleStop}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                  <Loader2 size={12} className="animate-spin" /> 停止
                </button>
              ) : (
                <button type="button" onClick={handleChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--nebula)] text-[#0a0e17] hover:opacity-90 transition-all">
                  发送
                </button>
              )}
            </>
          )}

          {chapter.outline && !streaming && (
            <button type="button" onClick={handleRewriteByOutline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-card-border hover:border-[var(--star)] text-[var(--star)] transition-colors">
              <Stars size={12} /> 按大纲重写
            </button>
          )}

          <button type="button" onClick={handleReview} disabled={reviewing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-card-border hover:border-[var(--star)] text-[var(--star)] transition-colors disabled:opacity-50">
            {reviewing ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
            {reviewing ? "审查中…" : "审查"}
          </button>

          {saved ? (
            <span className="flex items-center gap-1 px-3 py-1.5 text-xs text-emerald-400">
              <Check size={12} /> 已保存
            </span>
          ) : saving ? (
            <span className="flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin" /> 保存中…
            </span>
          ) : (
            <button type="button" onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--cyan-soft)] text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-[#0a0e17] transition-all">
              <Save size={12} /> 保存
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="text-[10px] text-red-400 mt-2">
          {error}
          {error.includes("API Key") && (
            <Link href="/workspace/settings" className="ml-2 underline text-[var(--cyan)]">前往设置</Link>
          )}
        </div>
      )}

      {/* Review results */}
      {review && (
        <div className="mt-4 p-4 rounded-xl bg-[var(--accent)] border border-card-border space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: severityColors[review.overall === "pass" ? "low" : review.overall === "fail" ? "critical" : "high"] }}>
              {review.overall === "pass" ? "通过" : review.overall === "fail" ? "不通过" : "需改进"}
            </span>
            <span className="text-xs text-muted-foreground">{review.summary}</span>
          </div>

          {review.issues.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-foreground">发现问题 ({review.issues.length})：</p>
              {review.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--background)]">
                  <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full" style={{ background: severityColors[issue.severity] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${severityColors[issue.severity]}15`, color: severityColors[issue.severity] }}>
                        {issue.severity}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{categoryLabels[issue.category] || issue.category}</span>
                      <span className="text-[10px] text-muted-foreground">— {issue.location}</span>
                    </div>
                    <p className="text-xs">{issue.description}</p>
                    {issue.fixHint && <p className="text-[11px] text-[var(--cyan)] mt-0.5">→ {issue.fixHint}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {review.strengths.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-foreground mb-1">亮点：</p>
              {review.strengths.map((s, i) => (
                <p key={i} className="text-xs text-[var(--star)]">+ {s}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
