import { NextResponse } from "next/server";
import { PersonInputSchema } from "@/lib/schemas/person";
import { createPerson, listPeople } from "@/server/people";
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
    const result = await listPeople({ search, marca, unidade, status, limit, offset });
    return NextResponse.json({
      ok: true,
      data: result.rows,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    return handleApiError(error, "people");
  }
}

export async function POST(request: Request) {
  const { session, response } = await requireAllowedUser();
  if (response) return response;

  const rate = checkRateLimit(request, {
    key: "people:create",
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
  const parsed = PersonInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados invalidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const person = await createPerson(parsed.data, getActorEmail(session));
    return NextResponse.json({ ok: true, data: person }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar pessoa.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
