import "server-only";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAllowedEmail, resolveAuthenticatedEmail } from "@/lib/auth";
import { getUserAccessProfile } from "@/server/user-access";

export const parseNumber = (value: string | null | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const getActorEmail = (session: { user?: { email?: string | null } } | null) => {
  const email = resolveAuthenticatedEmail(session?.user?.email);
  if (!email) {
    throw new Error("Session missing actor email after auth check.");
  }
  return email;
};

export const getActorRole = () => "USER" as const;

export const requireAllowedUser = async () => {
  const session = await getServerSession(authOptions);
  const email = resolveAuthenticatedEmail(session?.user?.email);

  if (!email) {
    return {
      session: null,
      actorRole: "USER" as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const profile = await getUserAccessProfile(email);
  if (!isAllowedEmail(email) && !profile) {
    return {
      session: null,
      actorRole: "USER" as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, actorRole: getActorRole(), response: null };
};

export const requireAdminUser = async () => {
  const { session, response, actorRole } = await requireAllowedUser();
  if (response) return { session: null, actorRole, response };

  const email = resolveAuthenticatedEmail(session?.user?.email);
  const profile = await getUserAccessProfile(email);
  if (profile?.role !== "ADMIN") {
    return {
      session: null,
      actorRole,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, actorRole: getActorRole(), response: null };
};

export const handleApiError = (error: unknown, context?: string) => {
  const message = error instanceof Error ? error.message : "Erro inesperado";
  const logPrefix = context ? `[${context}]` : "[api]";
  console.error(`${logPrefix} ${message}`, error);

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "code" in error
  ) {
    const apiErr = error as { message: string; status: number; code: string };
    return NextResponse.json(
      { ok: false, error: apiErr.message, code: apiErr.code },
      { status: apiErr.status },
    );
  }

  return NextResponse.json({ ok: false, error: message }, { status: 500 });
};
