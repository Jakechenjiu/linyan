import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BatchForm from "./BatchForm";

export default async function BatchPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  let session;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  if (!session?.user?.id) redirect("/login");

  const { error } = await searchParams;
  return <BatchForm initialError={error} />;
}
