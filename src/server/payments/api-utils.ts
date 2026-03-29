import { asApiError } from "@/server/payments/errors";
import { logger } from "@/server/payments/logger";
import { NextResponse } from "next/server";

export {
  getActorRole,
  requireAllowedUser,
  requireAdminUser,
  getActorEmail,
  parseNumber,
} from "@/server/api-utils";

export const handleApiError = (error: unknown) => {
  const apiError = asApiError(error);
  logger.error("API error", { message: apiError.message, code: apiError.code });
  return NextResponse.json(
    { error: apiError.message, code: apiError.code },
    { status: apiError.status },
  );
};
