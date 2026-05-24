"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand";

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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--cyan-soft)] via-transparent to-[var(--nebula-soft)] pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm space-y-8 p-8">
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
            className="w-full rounded-xl border border-card-border bg-card px-4 py-2.5 text-sm outline-none focus:border-[var(--cyan)] transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            required
            minLength={6}
            className="w-full rounded-xl border border-card-border bg-card px-4 py-2.5 text-sm outline-none focus:border-[var(--cyan)] transition-colors"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-2.5 text-sm font-bold text-white bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-40"
            style={{ color: "#0a0e17" }}
          >
            {loading ? "登录中…" : "登录"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          还没有账号？{" "}
          <Link href="/register" className="text-[var(--cyan)] hover:underline">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
