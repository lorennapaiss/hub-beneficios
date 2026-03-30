import type { PropsWithChildren } from "react";
import { getServerSession } from "next-auth";
import { AppShell } from "@/components/app-shell";
import { authOptions, resolveAuthenticatedEmail } from "@/lib/auth";
import { getUserAccessProfile } from "@/server/user-access";

export default async function AppLayout({ children }: PropsWithChildren) {
  const session = await getServerSession(authOptions);
  const profile = await getUserAccessProfile(resolveAuthenticatedEmail(session?.user?.email));

  return <AppShell role={profile?.role ?? "BENEFITS_ASSISTANT"}>{children}</AppShell>;
}
