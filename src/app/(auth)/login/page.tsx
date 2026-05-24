"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand";
import ParticleBg from "@/components/brand/ParticleBg";
import CursorGlow from "@/components/brand/CursorGlow";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("邮箱或密码错误");
      setLoading(false);
    } else {
      router.push("/workspace");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <ParticleBg />
      <CursorGlow />

      <div className="relative z-10 w-full max-w-sm space-y-8 px-6">
        {/* Card */}
        <div className="glass-card p-8 space-y-6 animate-scale-in">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <h2 className="text-center text-sm text-muted-foreground">登录你的创作空间</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="密码"
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
              {loading ? "登录中…" : "登录"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            还没有账号？{" "}
            <Link href="/register" className="text-[var(--cyan)] hover:underline underline-offset-2">
              注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
