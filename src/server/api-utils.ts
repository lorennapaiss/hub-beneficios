import "server-only";
import { NextResponse } from "next/server";

type SessionLike = { user?: { email?: string | null; name?: string | null } } | null;

export const parseNumber = (value: string | null | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const getActorEmail = (_session: SessionLike) => "anonymous";

export const getActorRole = () => "USER" as const;

export const requireAllowedUser = async () => ({
  session: null as SessionLike,
  actorRole: "USER" as const,
  response: null,
});

export const requireAdminUser = async () => ({
  session: null as SessionLike,
  actorRole: "USER" as const,
  response: null,
});

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
