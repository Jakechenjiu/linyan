import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
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

  // Fetch membership info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membership: true, membershipId: true },
  });

  return (
    <WorkspaceLayoutClient>
      <div className="flex h-screen relative z-10">
        <WorkspaceSidebar
          user={session.user}
          membership={{ tier: user?.membership || "free", membershipId: user?.membershipId }}
        />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </WorkspaceLayoutClient>
  );
}
