"use client";

import { useState, useRef, useCallback } from "react";
import type { Backlink } from "@/lib/notes";
import AiToolbar from "./AiToolbar";
import OutgoingLinks from "./OutgoingLinks";

export type { Backlink };

interface Props {
  id?: string;
  initialTitle?: string;
  initialBody?: string;
  initialTags?: string[];
  backlinks?: Backlink[];
  onSave: (data: { title: string; body: string; tags: string[] }) => void;
  onDelete?: () => void;
}

export default function NoteEditor({
  id,
  initialTitle = "",
  initialBody = "",
  initialTags = [],
  backlinks = [],
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialTags);
  const [suggestions, setSuggestions] = useState<{ id: string; title: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [expandedBacklink, setExpandedBacklink] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const searchNotes = useCallback(
    async (q: string) => {
      if (q.length < 1) { setSuggestions([]); return; }
      try {
        const res = await fetch(`/api/notes?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.filter((n: any) => n.title !== title));
        }
      } catch {}
    },
    [title]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIndex((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && suggestions.length > 0) {
        e.preventDefault();
        insertLink(suggestions[suggestionIndex].title);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setBody(value);

    const cursorPos = e.target.selectionStart;
    const beforeCursor = value.slice(0, cursorPos);
    const match = beforeCursor.match(/\[\[([^\]|]*)$/);
    if (match) {
      setShowSuggestions(true);
      setSuggestionIndex(0);
      searchNotes(match[1]);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertLink = (noteTitle: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursorPos = textarea.selectionStart;
    const beforeCursor = body.slice(0, cursorPos);
    const afterCursor = body.slice(cursorPos);
    const match = beforeCursor.match(/\[\[([^\]|]*)$/);
    if (match) {
      const newBody = beforeCursor.slice(0, beforeCursor.length - match[0].length) + `[[${noteTitle}]]` + afterCursor;
      setBody(newBody);
    }
    setShowSuggestions(false);
    textarea.focus();
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const t = tagInput.trim();
      if (t && !tags.includes(t)) setTags([...tags, t]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), body, tags });
  };

  // AI toolbar callbacks
  const handleAppendText = useCallback((text: string) => {
    setBody((prev) => prev + text);
  }, []);

  const handleReplaceText = useCallback((text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    setBody((prev) => prev.slice(0, start) + text + prev.slice(end));
  }, []);

  const handleAddAiTag = useCallback((tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="笔记标题…"
        className="w-full font-mono text-xl font-bold bg-transparent border-b border-card-border pb-2 focus:outline-none focus:border-[var(--cyan)] transition-colors"
      />

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-[var(--cyan-soft)] text-[var(--cyan)]"
          >
            #{t}
            <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-red-400">&times;</button>
          </span>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="添加标签…"
          className="text-[11px] bg-transparent border-b border-transparent focus:outline-none focus:border-[var(--cyan)] w-24 transition-colors"
        />
      </div>

      {/* Body with wikilinks autocomplete */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={18}
          className="w-full bg-transparent text-sm font-mono leading-relaxed resize-none focus:outline-none p-3 rounded-xl border border-card-border focus:border-[var(--cyan)] transition-colors min-h-[300px]"
          placeholder="写笔记… 用 [[标题]] 链接到其他笔记"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-20 left-0 right-0 bottom-full mb-1 bg-[var(--bg-elevated)] border border-card-border rounded-lg shadow-lg max-h-32 overflow-y-auto animate-scale-in">
            {suggestions.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => insertLink(s.title)}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--accent)] transition-colors ${
                  i === suggestionIndex ? "bg-[var(--accent)] text-[var(--cyan)]" : "text-muted-foreground"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI Toolbar */}
      <AiToolbar
        noteId={id}
        body={body}
        tags={tags}
        textareaRef={textareaRef}
        onAppendText={handleAppendText}
        onReplaceText={handleReplaceText}
        onAddTag={handleAddAiTag}
      />

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-card-border">
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn-shimmer px-4 py-2 rounded-lg text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_16px_rgba(0,229,255,0.3)] transition-all"
            style={{ color: "#0a0e17" }}
          >
            {id ? "保存" : "创建笔记"}
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
            >
              删除
            </button>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">
          使用 [[笔记名]] 创建链接
        </span>
      </div>

      {/* Outgoing Links */}
      {id && <OutgoingLinks body={body} currentTitle={title} />}

      {/* Backlinks with context */}
      {backlinks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-card-border">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            引用此笔记 ({backlinks.length})
          </h4>
          <div className="space-y-1">
            {backlinks.map((bl) => (
              <div key={bl.id}>
                <button
                  type="button"
                  onClick={() => setExpandedBacklink(expandedBacklink === bl.id ? null : bl.id)}
                  className="flex items-center gap-1 text-xs text-[var(--cyan)] hover:underline"
                >
                  {expandedBacklink === bl.id ? "▾" : "▸"} {bl.fromNote.title}
                </button>
                {expandedBacklink === bl.id && bl.context && (
                  <div className="mt-1 ml-4 p-2 rounded bg-[var(--bg-elevated)] border border-card-border text-[11px] text-muted-foreground leading-relaxed">
                    {bl.context}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
