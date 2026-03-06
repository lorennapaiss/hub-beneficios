import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, isAdminEmail } from "@/lib/auth";
import { FaturasConfig } from "@/components/faturas/faturas-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FaturasConfigPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  return <FaturasConfig />;
}
