import { NextResponse } from "next/server";
import { requireAllowedUser, getActorEmail, handleApiError } from "@/server/api-utils";
import { generatePjHealthDescriptiveBatch } from "@/server/pj-health-descriptive";
import { checkRateLimit } from "@/server/rate-limit";

export async function POST(request: Request) {
  const { session, response } = await requireAllowedUser();
  if (response) return response;

  const rate = checkRateLimit(request, {
    key: "pjs:descritivo:lote",
    limit: 5,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas requisicoes. Tente novamente." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const competencia = String(body.competencia ?? "").trim();
  if (!competencia) {
    return NextResponse.json(
      { ok: false, error: "Informe a competencia no formato AAAA-MM." },
      { status: 400 },
    );
  }

  try {
    const result = await generatePjHealthDescriptiveBatch(
      competencia,
      getActorEmail(session),
    );
    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "pjs:descritivo:lote");
  }
}
