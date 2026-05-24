import Link from "next/link";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/brand";

export default async function PublicNav() {
  let session;
  try {
    session = await auth();
  } catch {
    // DB down or auth error — treat as unauthenticated
    session = null;
  }

  return (
    <nav className="relative z-10 glass-card border-b border-white/[0.04] rounded-none mx-0">
      <div className="flex items-center justify-between px-6 py-3.5 max-w-7xl mx-auto w-full">
        <Logo size="md" />
        <div className="flex items-center gap-5">
          <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
            探索
          </Link>
          {session ? (
            <Link
              href="/workspace"
              className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all duration-300"
              style={{ color: "#0a0e17" }}
            >
              进入工作台
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                登录
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all duration-300"
                style={{ color: "#0a0e17" }}
              >
                免费注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
