"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function WorkspaceError({ error, reset }: Props) {
  useEffect(() => {
    console.error("Workspace error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <AlertTriangle size={40} className="text-red-400 mb-4" />
      <h1 className="text-xl font-bold font-mono mb-2">页面加载失败</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {error.message || "发生了意外错误，请重试。"}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--cyan)] text-[#0a0e17] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
        >
          <RefreshCw size={14} /> 重试
        </button>
        <Link
          href="/workspace"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-card-border text-muted-foreground hover:text-foreground hover:bg-[var(--accent)] transition-all"
        >
          <Home size={14} /> 返回仪表盘
        </Link>
      </div>
    </div>
  );
}
