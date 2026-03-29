import { NextResponse } from "next/server";
import { CardInputSchema } from "@/lib/schemas/card";
import { createCard, listCards } from "@/server/cards";
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
  const marca = searchParams.get("marca") ?? undefined;
  const unidade = searchParams.get("unidade") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const limit = parseNumber(searchParams.get("limit"), 10);
  const offset = parseNumber(searchParams.get("offset"), 0);

  try {
    const result = await listCards({ search, marca, unidade, status, limit, offset });
    return NextResponse.json({
      ok: true,
      data: result.rows,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    return handleApiError(error, "cards");
  }
}

export async function POST(request: Request) {
  const { session, response } = await requireAllowedUser();
  if (response) return response;

  const rate = checkRateLimit(request, {
    key: "cards:create",
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas requisicoes. Tente novamente." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = CardInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados invalidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const card = await createCard(parsed.data, getActorEmail(session));
    return NextResponse.json({ ok: true, data: card }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar cartao.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
