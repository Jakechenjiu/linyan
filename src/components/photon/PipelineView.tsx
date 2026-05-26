"use client";

import { WorkflowNode, NodeStatus } from "@/lib/photon/workflows";
import { FileText, Wand2, Video, Mic, Settings, Package, Download, Check, Loader2, AlertCircle, SkipForward, ChevronRight } from "lucide-react";

const NODE_ICONS: Record<string, React.ReactNode> = {
  "input": <FileText size={16} />,
  "ai-text": <Wand2 size={16} />,
  "ai-video": <Video size={16} />,
  "ai-voice": <Mic size={16} />,
  "process": <Settings size={16} />,
  "assemble": <Package size={16} />,
  "export": <Download size={16} />,
};

const STATUS_CONFIG: Record<NodeStatus, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "text-muted-foreground", bg: "bg-muted-foreground/10", icon: <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/30" />, label: "等待中" },
  running: { color: "text-[var(--cyan)]", bg: "bg-[var(--cyan)]/10", icon: <Loader2 size={12} className="animate-spin text-[var(--cyan)]" />, label: "执行中" },
  done: { color: "text-emerald-400", bg: "bg-emerald-400/10", icon: <Check size={12} className="text-emerald-400" />, label: "完成" },
  error: { color: "text-red-400", bg: "bg-red-400/10", icon: <AlertCircle size={12} className="text-red-400" />, label: "错误" },
  skipped: { color: "text-muted-foreground/50", bg: "bg-muted-foreground/5", icon: <SkipForward size={12} />, label: "跳过" },
};

export default function PipelineView({
  nodes,
  activeNodeId,
  onNodeClick,
}: {
  nodes: WorkflowNode[];
  activeNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 px-4 py-3 overflow-x-auto">
      {nodes.map((node, idx) => {
        const status = STATUS_CONFIG[node.status];
        const isActive = activeNodeId === node.id;
        const isClickable = node.status !== "skipped";

        return (
          <div key={node.id} className="flex items-center">
            {/* Node */}
            <button
              onClick={() => isClickable && onNodeClick(node.id)}
              disabled={!isClickable}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                isActive
                  ? "border-[var(--cyan)] bg-[var(--cyan)]/5 shadow-[0_0_12px_rgba(0,229,255,0.15)]"
                  : node.status === "done"
                  ? "border-emerald-400/20 bg-emerald-400/5"
                  : node.status === "error"
                  ? "border-red-400/20 bg-red-400/5"
                  : "border-card-border bg-[var(--accent)]"
              } ${isClickable ? "cursor-pointer hover:border-[var(--cyan)]" : "cursor-default opacity-60"}`}
            >
              {/* Icon */}
              <div className={`p-1.5 rounded-lg ${status.bg}`}>
                {NODE_ICONS[node.type] || <Settings size={16} />}
              </div>

              {/* Label + Status */}
              <div className="text-left min-w-0">
                <p className={`text-[11px] font-medium truncate ${isActive ? "text-[var(--cyan)]" : ""}`}>
                  {node.label}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {status.icon}
                  <span className={`text-[9px] ${status.color}`}>{status.label}</span>
                </div>
              </div>
            </button>

            {/* Arrow */}
            {idx < nodes.length - 1 && (
              <ChevronRight size={14} className="text-muted-foreground/30 mx-1 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
