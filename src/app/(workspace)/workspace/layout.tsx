import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import WorkspaceLayoutClient from "./WorkspaceLayoutClient";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await auth();
  } catch {
    return <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>;
  }
  if (!session?.user) redirect("/login");

  const sidebar = <WorkspaceSidebar user={session.user} />;

  return (
    <WorkspaceLayoutClient sidebar={sidebar}>
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-20">
        {children}
      </main>
    </WorkspaceLayoutClient>
  );
}
