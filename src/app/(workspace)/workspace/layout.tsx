import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
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
