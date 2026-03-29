import { NextResponse } from "next/server";
import { requireAllowedUser, getActorEmail, handleApiError } from "@/server/api-utils";
import { importPjsFromCsvBuffer } from "@/server/pj-import";
import { checkRateLimit } from "@/server/rate-limit";

export async function POST(request: Request) {
  const { session, response } = await requireAllowedUser();
  if (response) return response;

  const rate = checkRateLimit(request, {
    key: "pjs:import",
    limit: 5,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas requisicoes. Tente novamente." },
      { status: 429 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Envie um arquivo CSV." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importPjsFromCsvBuffer(buffer, getActorEmail(session));
    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "pjs:import");
  }
}
