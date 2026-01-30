import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminEmail, isAllowedEmail } from "@/lib/auth";
import { asApiError } from "@/server/payments/errors";
import { logger } from "@/server/payments/logger";

export const getActorRole = (email?: string | null) =>
  isAdminEmail(email) ? "ADMIN" : "USER";

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

export const handleApiError = (error: unknown) => {
  const apiError = asApiError(error);
  logger.error("API error", { message: apiError.message, code: apiError.code });
  return NextResponse.json(
    { error: apiError.message, code: apiError.code },
    { status: apiError.status },
  );
};
