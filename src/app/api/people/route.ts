import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAllowedEmail } from "@/lib/auth";
import { PersonInputSchema } from "@/lib/schemas/person";
import { createPerson, listPeople } from "@/server/people";
import { checkRateLimit } from "@/server/rate-limit";

const parseNumber = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const getActorEmail = (email?: string | null) => email ?? "unknown";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAllowedEmail(session?.user?.email)) {
    return NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 403 });
  }

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
    console.error("Erro ao listar pessoas.", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao listar pessoas." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAllowedEmail(session?.user?.email)) {
    return NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 403 });
  }

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
    const person = await createPerson(parsed.data, getActorEmail(session?.user?.email));
    return NextResponse.json({ ok: true, data: person }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar pessoa.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
