"use client";

import { useState } from "react";
import { Sparkles, Zap, Lightbulb, MessageCircle, Loader2 } from "lucide-react";

interface Props {
  noteId?: string;
  body: string;
  tags: string[];
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onAppendText: (text: string) => void;
  onReplaceText: (text: string) => void;
  onAddTag: (tag: string) => void;
}

export default function AiToolbar({
  noteId,
  body,
  tags,
  textareaRef,
  onAppendText,
  onReplaceText,
  onAddTag,
}: Props) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [summaryPopup, setSummaryPopup] = useState<string | null>(null);

  const apiUrl = noteId ? `/api/notes/${noteId}/ai` : null;

  // Continue writing (streaming)
  const handleContinue = async () => {
    if (!apiUrl || !noteId) return;
    setLoadingAction("continue");
    try {
      const res = await fetch(`${apiUrl}?action=continue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let appended = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk.startsWith("[ERROR]")) throw new Error(chunk.slice(7));
        appended += chunk;
        onAppendText(chunk);
      }
    } catch (e: any) {
      alert(e.message || "续写失败");
    } finally {
      setLoadingAction(null);
    }
  };

  // Polish selected text (non-streaming)
  const handlePolish = async () => {
    if (!apiUrl || !noteId) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const selected = ta.value.slice(ta.selectionStart, ta.selectionEnd);
    if (!selected.trim()) {
      alert("请先选中要润色的文本");
      return;
    }
    setLoadingAction("polish");
    try {
      const res = await fetch(`${apiUrl}?action=polish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selected }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      onReplaceText(data.result);
    } catch (e: any) {
      alert(e.message || "润色失败");
    } finally {
      setLoadingAction(null);
    }
  };

  // Summarize (non-streaming)
  const handleSummarize = async () => {
    if (!apiUrl || !noteId) return;
    setLoadingAction("summarize");
    try {
      const res = await fetch(`${apiUrl}?action=summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setSummaryPopup(data.result);
    } catch (e: any) {
      alert(e.message || "摘要生成失败");
    } finally {
      setLoadingAction(null);
    }
  };

  // Tag suggestions (non-streaming)
  const handleTagSuggest = async () => {
    if (!apiUrl || !noteId) return;
    setLoadingAction("tags");
    try {
      const res = await fetch(`${apiUrl}?action=tag-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setSuggestedTags(data.tags.filter((t: string) => !tags.includes(t)));
    } catch (e: any) {
      alert(e.message || "标签建议失败");
    } finally {
      setLoadingAction(null);
    }
  };

  // Chat (streaming)
  const handleChat = async () => {
    if (!apiUrl || !noteId || !chatQuestion.trim()) return;
    setChatLoading(true);
    setChatReply("");
    try {
      const res = await fetch(`${apiUrl}?action=chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: chatQuestion, body }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk.startsWith("[ERROR]")) throw new Error(chunk.slice(7));
        setChatReply((prev) => prev + chunk);
      }
    } catch (e: any) {
      setChatReply((prev) => prev + `\n\n❌ ${e.message}`);
    } finally {
      setChatLoading(false);
    }
  };

  const btnClass = (action: string) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-all border border-transparent hover:border-card-border hover:bg-[var(--accent)] ${
      loadingAction === action ? "text-[var(--star)]" : "text-muted-foreground hover:text-foreground"
    } disabled:opacity-40`;

  return (
    <div className="space-y-3">
      {/* Toolbar buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        <button type="button" onClick={handleContinue} disabled={loadingAction !== null || !noteId} className={btnClass("continue")}>
          {loadingAction === "continue" ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          续写
        </button>
        <button type="button" onClick={handlePolish} disabled={loadingAction !== null || !noteId} className={btnClass("polish")}>
          {loadingAction === "polish" ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
          润色
        </button>
        <button type="button" onClick={handleSummarize} disabled={loadingAction !== null || !noteId} className={btnClass("summarize")}>
          {loadingAction === "summarize" ? <Loader2 size={12} className="animate-spin" /> : <Lightbulb size={12} />}
          摘要
        </button>
        <button type="button" onClick={handleTagSuggest} disabled={loadingAction !== null || !noteId} className={btnClass("tags")}>
          {loadingAction === "tags" ? <Loader2 size={12} className="animate-spin" /> : <span className="text-[10px]">#</span>}
          标签建议
        </button>
        <button type="button" onClick={() => { setChatOpen(!chatOpen); setChatReply(""); setChatQuestion(""); }} disabled={!noteId} className={btnClass("chat")}>
          <MessageCircle size={12} />
          {chatOpen ? "关闭对话" : "对话"}
        </button>
      </div>

      {/* Suggested tags */}
      {suggestedTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground">建议标签：</span>
          {suggestedTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { onAddTag(t); setSuggestedTags((prev) => prev.filter((x) => x !== t)); }}
              className="px-2 py-0.5 rounded text-[10px] border border-dashed border-[var(--cyan)]/40 text-[var(--cyan)] hover:bg-[var(--cyan-soft)] transition-colors"
            >
              + #{t}
            </button>
          ))}
        </div>
      )}

      {/* Summary popup */}
      {summaryPopup && (
        <div className="relative p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--star)]/20">
          <button type="button" onClick={() => setSummaryPopup(null)} className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-foreground">&times;</button>
          <h4 className="text-xs font-bold text-[var(--star)] mb-2">AI 摘要</h4>
          <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{summaryPopup}</div>
        </div>
      )}

      {/* Chat panel */}
      {chatOpen && (
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-card-border space-y-3">
          <h4 className="text-xs font-bold text-[var(--cyan)]">基于笔记对话</h4>
          <div className="flex gap-2">
            <input
              value={chatQuestion}
              onChange={(e) => setChatQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleChat(); }}
              placeholder="向 AI 提问关于这篇笔记的问题…"
              className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--background)] border border-card-border text-xs focus:outline-none focus:border-[var(--cyan)] transition-colors"
            />
            <button
              type="button"
              onClick={handleChat}
              disabled={chatLoading || !chatQuestion.trim()}
              className="px-3 py-1.5 rounded-lg text-xs bg-[var(--cyan)] text-[#0a0e17] disabled:opacity-40 transition-all"
            >
              {chatLoading ? <Loader2 size={12} className="animate-spin" /> : "发送"}
            </button>
          </div>
          {chatReply && (
            <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto p-3 rounded-lg bg-[var(--background)] border border-card-border">
              {chatReply}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
