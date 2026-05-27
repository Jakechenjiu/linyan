"use client";

import { useState } from "react";
import { Crown, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function MembershipCodeInput() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleRedeem = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/membership/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ type: "error", message: data.error || "验证失败" });
      } else {
        setResult({ type: "success", message: data.message || "升级成功" });
        setCode("");
        // Refresh page after 2 seconds
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch {
      setResult({ type: "error", message: "网络错误，请重试" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === "Enter") handleRedeem(); }}
          placeholder="输入会员码，如 LYAN-XXXX-XXXX-XXXX-XXXX"
          className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--background)] border border-card-border text-sm font-mono focus:outline-none focus:border-[var(--star)] transition-colors"
          disabled={loading}
        />
        <button
          onClick={handleRedeem}
          disabled={loading || !code.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-[var(--star)]/15 text-[var(--star)] hover:bg-[var(--star)] hover:text-[#0a0e17] transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} />}
          {loading ? "验证中…" : "激活"}
        </button>
      </div>

      {result && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
          result.type === "success"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          {result.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {result.message}
        </div>
      )}
    </div>
  );
}
