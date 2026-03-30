import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { sendPasswordRecoveryEmail } from "@/server/auth/password-actions";
import { handleApiError } from "@/server/api-utils";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const origin = new URL(request.url).origin;
    const result = await sendPasswordRecoveryEmail({
      email: body.email,
      redirectTo: `${origin}/auth/complete`,
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "Dados inválidos.", details: error.flatten() },
        { status: 400 },
      );
    }

    return handleApiError(error, "auth-forgot-password");
  }
}
