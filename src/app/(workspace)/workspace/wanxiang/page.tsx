import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import WanxiangPage from "./WanxiangClient";

export default async function WanxiangServerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <WanxiangPage />;
}
