import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAllowedEmail } from "@/lib/auth";
import { PjInputSchema } from "@/lib/schemas/pj";
import { getPjDetailById, updatePj } from "@/server/pjs";
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

export async function GET(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!isAllowedEmail(session?.user?.email)) {
    return NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 403 });
  }

  try {
    const id = (await resolveId(request, params)).trim();
    const detail = await getPjDetailById(id);
    if (!detail) {
      const hint = isUuid(id)
        ? "Confira se o pj_id no Sheets esta como texto."
        : "pj_id invalido.";
      return NextResponse.json(
        { ok: false, error: `PJ nao encontrado. ${hint}` },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, data: detail });
  } catch (error) {
    console.error("Erro ao buscar PJ.", error);
    return NextResponse.json({ ok: false, error: "Erro ao buscar PJ." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!isAllowedEmail(session?.user?.email)) {
    return NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 403 });
  }

  const rate = checkRateLimit(request, {
    key: "pjs:update",
    limit: 30,
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
    const id = (await resolveId(request, params)).trim();
    const pj = await updatePj(id, parsed.data, getActorEmail(session?.user?.email));
    return NextResponse.json({ ok: true, data: pj });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar PJ.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
