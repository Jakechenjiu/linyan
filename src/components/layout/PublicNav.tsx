import Link from "next/link";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/brand";

export default async function PublicNav() {
  const session = await auth();

  return (
    <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
      <Logo size="md" />
      <div className="flex items-center gap-4">
        <Link href="/explore" className="text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors">
          探索
        </Link>
        {session ? (
          <Link
            href="/workspace"
            className="px-4 py-2 rounded-lg text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
            style={{ color: "#0a0e17" }}
          >
            进入工作台
          </Link>
        ) : (
          <>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-[var(--cyan)] transition-colors">
              登录
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg text-sm font-bold bg-[var(--cyan)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
              style={{ color: "#0a0e17" }}
            >
              免费注册
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
