import { NextResponse } from "next/server";
import { requireAllowedUser, getActorEmail, handleApiError } from "@/server/api-utils";
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

const getCompetencia = (request: Request) =>
  new URL(request.url).searchParams.get("competencia")?.trim() ?? "";

export async function GET(request: Request, { params }: RouteParams) {
  const { response } = await requireAllowedUser();
  if (response) return response;

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
    return handleApiError(error, "pjs:descritivo:preview");
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const { session, response } = await requireAllowedUser();
  if (response) return response;

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
      actor: getActorEmail(session),
    });
    return NextResponse.json({ ok: true, data: preview }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "pjs:descritivo:generate");
  }
}
