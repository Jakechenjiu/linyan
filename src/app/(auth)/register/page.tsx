"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand";
import ParticleBg from "@/components/brand/ParticleBg";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "注册失败");
      } else {
        router.push("/login");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <ParticleBg />

      <div className="relative z-10 w-full max-w-sm space-y-8 px-6">
        <div className="glass-card p-8 space-y-6 animate-scale-in">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <h2 className="text-center text-sm text-muted-foreground">创建你的创作空间</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="昵称（可选）"
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm outline-none focus:border-[var(--cyan)] focus:bg-white/[0.04] transition-all duration-200 placeholder:text-muted-foreground/50"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱"
              required
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm outline-none focus:border-[var(--cyan)] focus:bg-white/[0.04] transition-all duration-200 placeholder:text-muted-foreground/50"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码（至少6位）"
              required
              minLength={6}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm outline-none focus:border-[var(--cyan)] focus:bg-white/[0.04] transition-all duration-200 placeholder:text-muted-foreground/50"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-2.5 text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_24px_rgba(0,229,255,0.3)] transition-all duration-300 disabled:opacity-40 btn-shimmer"
              style={{ color: "#0a0e17" }}
            >
              {loading ? "创建中…" : "注册"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            已有账号？{" "}
            <Link href="/login" className="text-[var(--cyan)] hover:underline underline-offset-2">
              登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
