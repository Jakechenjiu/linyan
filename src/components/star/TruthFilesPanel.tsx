"use client";

import { useState, useEffect } from "react";
import { Database, Loader2, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";

interface TruthFile {
  type: string;
  content: string;
  version: number;
  updatedAt: string;
}

const TRUTH_FILE_LABELS: Record<string, string> = {
  current_state: "世界状态",
  particle_ledger: "资源账本",
  pending_hooks: "伏笔池",
  chapter_summaries: "章节摘要",
  subplot_board: "支线进度板",
  emotional_arcs: "情感弧线",
  character_matrix: "角色交互矩阵",
};

const TRUTH_FILE_ICONS: Record<string, string> = {
  current_state: "🌍",
  particle_ledger: "📦",
  pending_hooks: "🪝",
  chapter_summaries: "📝",
  subplot_board: "🎭",
  emotional_arcs: "💫",
  character_matrix: "👥",
};

export default function TruthFilesPanel({
  novelId,
  refreshTrigger,
}: {
  novelId: string;
  refreshTrigger?: number;
}) {
  const [files, setFiles] = useState<TruthFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTruthFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/novels/${novelId}/truth-files`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "加载失败");

      setFiles(data.files || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTruthFiles();
  }, [novelId, refreshTrigger]);

  const toggleExpand = (type: string) => {
    setExpandedType(expandedType === type ? null : type);
  };

  const getFileByType = (type: string) => {
    return files.find((f) => f.type === type);
  };

  const getContentPreview = (content: string, maxLength: number = 100) => {
    if (!content) return "(空)";
    const firstLine = content.split("\n")[0] || "";
    return firstLine.length > maxLength
      ? firstLine.slice(0, maxLength) + "..."
      : firstLine;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Database size={12} className="text-[var(--cyan)]" />
          <span className="text-xs font-medium">真相文件</span>
        </div>
        <button
          onClick={loadTruthFiles}
          disabled={loading}
          className="p-1 rounded hover:bg-[var(--accent)] transition-colors"
          title="刷新"
        >
          <RefreshCw
            size={10}
            className={`text-muted-foreground ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-[11px] text-red-400 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && files.length === 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Truth files list */}
      {Object.entries(TRUTH_FILE_LABELS).map(([type, label]) => {
        const file = getFileByType(type);
        const isExpanded = expandedType === type;
        const hasContent = file?.content && file.content.trim().length > 0;

        return (
          <div
            key={type}
            className="rounded-lg border border-card-border overflow-hidden"
          >
            {/* Header */}
            <button
              onClick={() => toggleExpand(type)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--accent)] transition-colors"
            >
              <span className="text-sm">{TRUTH_FILE_ICONS[type]}</span>
              <span className="flex-1 text-left text-[11px] font-medium">
                {label}
              </span>
              {file?.version && file.version > 1 && (
                <span className="text-[9px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-[var(--accent)]">
                  v{file.version}
                </span>
              )}
              {hasContent ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              )}
              {isExpanded ? (
                <ChevronDown size={10} className="text-muted-foreground" />
              ) : (
                <ChevronRight size={10} className="text-muted-foreground" />
              )}
            </button>

            {/* Content */}
            {isExpanded && (
              <div className="px-3 pb-3">
                {hasContent ? (
                  <div className="max-h-40 overflow-y-auto">
                    <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                      {file!.content}
                    </pre>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">
                    暂无数据，生成章节后自动更新
                  </p>
                )}
                {file?.updatedAt && (
                  <p className="text-[9px] text-muted-foreground mt-2">
                    更新于：{new Date(file.updatedAt).toLocaleString("zh-CN")}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Stats */}
      {files.length > 0 && (
        <div className="text-[10px] text-muted-foreground text-center">
          {files.filter((f) => f.content.trim().length > 0).length} /{" "}
          {Object.keys(TRUTH_FILE_LABELS).length} 个文件有内容
        </div>
      )}
    </div>
  );
}
