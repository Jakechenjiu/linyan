"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, Zap } from "lucide-react";

export default function ApiTestButton({
  provider,
  apiKey,
  baseUrl,
  model,
}: {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model?: string;
}) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setResult({ success: false, message: "请先输入 API Key" });
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const res = await fetch("/api/settings/test-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey, baseUrl, model }),
      });

      const data = await res.json();
      setResult({
        success: data.success,
        message: data.success ? data.message : data.error,
      });
    } catch {
      setResult({ success: false, message: "测试失败，请检查网络" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleTest}
        disabled={testing || !apiKey.trim()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--accent)] border border-card-border text-muted-foreground hover:text-foreground hover:border-[var(--cyan)] transition-all disabled:opacity-40"
      >
        {testing ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
        {testing ? "测试中…" : "测试连接"}
      </button>
      {result && (
        <span className={`flex items-center gap-1 text-[11px] ${result.success ? "text-emerald-400" : "text-red-400"}`}>
          {result.success ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
          {result.message}
        </span>
      )}
    </div>
  );
}
