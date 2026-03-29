import { NextResponse } from "next/server";
import { PjInputSchema } from "@/lib/schemas/pj";
import { createPj, listPjs } from "@/server/pjs";
import { checkRateLimit } from "@/server/rate-limit";
import {
  requireAllowedUser,
  getActorEmail,
  parseNumber,
  handleApiError,
} from "@/server/api-utils";

export async function GET(request: Request) {
  const { response } = await requireAllowedUser();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const status_vinculo = searchParams.get("status_vinculo") ?? undefined;
  const marca = searchParams.get("marca") ?? undefined;
  const area = searchParams.get("area") ?? undefined;
  const gestor_responsavel = searchParams.get("gestor_responsavel") ?? undefined;
  const centro_custo = searchParams.get("centro_custo") ?? undefined;
  const status_documental = searchParams.get("status_documental") ?? undefined;
  const benefit_status = searchParams.get("benefit_status") ?? undefined;
  const limit = parseNumber(searchParams.get("limit"), 10);
  const offset = parseNumber(searchParams.get("offset"), 0);

  try {
    const result = await listPjs({
      search,
      status_vinculo,
      marca,
      area,
      gestor_responsavel,
      centro_custo,
      status_documental,
      benefit_status,
      limit,
      offset,
    });
    return NextResponse.json({
      ok: true,
      data: result.rows,
      total: result.total,
      summary: result.summary,
      limit,
      offset,
    });
  } catch (error) {
    return handleApiError(error, "pjs");
  }
}

export async function POST(request: Request) {
  const { session, response } = await requireAllowedUser();
  if (response) return response;

  const rate = checkRateLimit(request, {
    key: "pjs:create",
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas requisicoes. Tente novamente." },
      { status: 429 },
    );
  }

  const body = await request.json();
  const parsed = PjInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados invalidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const pj = await createPj(parsed.data, getActorEmail(session));
    return NextResponse.json({ ok: true, data: pj }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar PJ.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
