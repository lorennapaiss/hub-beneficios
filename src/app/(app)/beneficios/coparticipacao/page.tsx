import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, isAllowedEmail } from "@/lib/auth";
import { CoparticipacaoModule } from "@/modules/coparticipacao";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CoparticipacaoPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!isAllowedEmail(email)) {
    redirect("/");
  }

  return <CoparticipacaoModule />;
}
