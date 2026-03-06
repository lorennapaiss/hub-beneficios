import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, isAdminEmail, isAllowedEmail } from "@/lib/auth";
import { AnaliseFaturasClient } from "@/components/faturas/analise-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InvoiceAnalysisPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!isAllowedEmail(email)) {
    redirect("/");
  }

  const isAdmin = isAdminEmail(email);

  return <AnaliseFaturasClient isAdmin={isAdmin} />;
}
