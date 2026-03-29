import "server-only";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminEmail, isAllowedEmail } from "@/lib/auth";

export const parseNumber = (value: string | null | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const getActorEmail = (session: { user?: { email?: string | null } } | null) => {
  const email = session?.user?.email;
  if (!email) {
    throw new Error("Session missing actor email after auth check.");
  }
  return email;
};

export const getActorRole = (email?: string | null) =>
  isAdminEmail(email) ? ("ADMIN" as const) : ("USER" as const);

export const requireAllowedUser = async () => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return {
      session: null,
      actorRole: "USER" as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isAllowedEmail(email)) {
    return {
      session: null,
      actorRole: "USER" as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, actorRole: getActorRole(email), response: null };
};

export const requireAdminUser = async () => {
  const { session, response, actorRole } = await requireAllowedUser();
  if (response) return { session: null, actorRole, response };

  const email = session?.user?.email ?? null;
  if (!isAdminEmail(email)) {
    return {
      session: null,
      actorRole,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, actorRole: getActorRole(email), response: null };
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
