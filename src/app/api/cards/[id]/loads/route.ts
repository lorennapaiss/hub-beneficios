import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAllowedEmail } from "@/lib/auth";
import { LoadInputSchema } from "@/lib/schemas/load";
import { getCardById } from "@/server/cards";
import { createLoad } from "@/server/loads";
import { checkRateLimit } from "@/server/rate-limit";
import { isUuid } from "@/lib/uuid";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const resolveId = async (request: Request, params: RouteParams["params"]) => {
  try {
    const awaited = await params;
    if (awaited?.id) return awaited.id;
  } catch {
    // ignore
  }
  const pathname = new URL(request.url).pathname;
  return pathname.split("/").pop() ?? "";
};

const getActorEmail = (email?: string | null) => email ?? "unknown";

const parseNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? NaN : parsed;
  }
  return NaN;
};

export async function POST(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!isAllowedEmail(session?.user?.email)) {
    return NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 403 });
  }

  const rate = checkRateLimit(request, {
    key: "cards:loads",
    limit: 10,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas requisicoes. Tente novamente." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const payload = {
    ...body,
    valor_carga: parseNumber(body?.valor_carga),
  };
  const parsed = LoadInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados invalidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const id = (await resolveId(request, params)).trim();
    const card = await getCardById(id);
    if (!card) {
      const hint = isUuid(id)
        ? "Confira se o card_id no Sheets esta como texto."
        : "card_id invalido.";
      return NextResponse.json(
        { ok: false, error: `Cartao nao encontrado. ${hint}` },
        { status: 404 }
      );
    }

    const load = await createLoad({
      card,
      ...parsed.data,
      created_by: getActorEmail(session?.user?.email),
    });

    return NextResponse.json({ ok: true, data: load }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao registrar carga.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
