import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import WorkspaceLayoutClient from "./WorkspaceLayoutClient";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await auth();
  } catch {
    return <main className="flex-1 overflow-y-auto p-8">{children}</main>;
  }
  if (!session?.user) redirect("/login");

  return (
    <WorkspaceLayoutClient>
      <div className="flex h-screen relative z-10">
        <WorkspaceSidebar user={session.user} />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </WorkspaceLayoutClient>
  );
}
