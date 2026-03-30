import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { completePasswordSetup } from "@/server/auth/password-actions";
import { handleApiError } from "@/server/api-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await completePasswordSetup(body);
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "Dados inválidos.", details: error.flatten() },
        { status: 400 },
      );
    }

    return handleApiError(error, "auth-password-complete");
  }
}
