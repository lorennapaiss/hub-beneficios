import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAllowedEmail } from "@/lib/auth";
import {
  generatePjHealthDescriptive,
  getPjHealthDescriptivePreview,
} from "@/server/pj-health-descriptive";
import { checkRateLimit } from "@/server/rate-limit";

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
  return pathname.split("/").at(-2) ?? "";
};

const getActorEmail = (email?: string | null) => email ?? "unknown";

const getCompetencia = (request: Request) =>
  new URL(request.url).searchParams.get("competencia")?.trim() ?? "";

export async function GET(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!isAllowedEmail(session?.user?.email)) {
    return NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 403 });
  }

  const competencia = getCompetencia(request);
  if (!competencia) {
    return NextResponse.json(
      { ok: false, error: "Informe a competencia no formato AAAA-MM." },
      { status: 400 },
    );
  }

  try {
    const id = (await resolveId(request, params)).trim();
    const preview = await getPjHealthDescriptivePreview(id, competencia);
    return NextResponse.json({ ok: true, data: preview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao montar descritivo.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!isAllowedEmail(session?.user?.email)) {
    return NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 403 });
  }

  const rate = checkRateLimit(request, {
    key: "pjs:descritivo",
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas requisicoes. Tente novamente." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const competencia = String(body.competencia ?? getCompetencia(request)).trim();
  if (!competencia) {
    return NextResponse.json(
      { ok: false, error: "Informe a competencia no formato AAAA-MM." },
      { status: 400 },
    );
  }

  try {
    const id = (await resolveId(request, params)).trim();
    const preview = await generatePjHealthDescriptive(id, competencia, {
      persist: true,
      actor: getActorEmail(session?.user?.email),
    });
    return NextResponse.json({ ok: true, data: preview }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao gerar descritivo.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
