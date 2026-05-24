"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import Link from "next/link";

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-card rounded-2xl p-12 text-center max-w-lg mx-auto">
      <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
      <h2 className="font-mono text-xl font-bold mb-2">编辑器加载失败</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {error.message || "页面加载时发生错误，可能是网络或数据库连接问题。"}
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-card-border hover:border-[var(--cyan)] transition-colors"
        >
          <RotateCw size={14} /> 重新加载
        </button>
        <Link
          href="/workspace/photon"
          className="text-sm text-[var(--cyan)] hover:underline"
        >
          返回光子发布
        </Link>
      </div>
    </div>
  );
}
