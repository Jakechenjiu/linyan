"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand";

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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--cyan-soft)] via-transparent to-[var(--nebula-soft)] pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm space-y-8 p-8">
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
            className="w-full rounded-xl border border-card-border bg-card px-4 py-2.5 text-sm outline-none focus:border-[var(--cyan)] transition-colors"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            required
            className="w-full rounded-xl border border-card-border bg-card px-4 py-2.5 text-sm outline-none focus:border-[var(--cyan)] transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码（至少6位）"
            required
            minLength={6}
            className="w-full rounded-xl border border-card-border bg-card px-4 py-2.5 text-sm outline-none focus:border-[var(--cyan)] transition-colors"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-2.5 text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-40"
            style={{ color: "#0a0e17" }}
          >
            {loading ? "创建中…" : "注册"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          已有账号？{" "}
          <Link href="/login" className="text-[var(--cyan)] hover:underline">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
