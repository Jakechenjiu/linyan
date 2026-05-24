import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await auth();
  } catch {
    // Auth failed (likely DB down) — show children without sidebar
    // The error boundary will catch downstream issues
    return <main className="flex-1 overflow-y-auto p-8">{children}</main>;
  }
  if (!session?.user) redirect("/login");

  return (
    <div className="flex h-screen">
      <WorkspaceSidebar user={session.user} />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
