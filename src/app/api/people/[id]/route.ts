import { NextResponse } from "next/server";
import { requireAllowedUser, getActorEmail, handleApiError } from "@/server/api-utils";
import { PersonInputSchema } from "@/lib/schemas/person";
import { getPersonById, updatePerson } from "@/server/people";
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

export async function GET(request: Request, { params }: RouteParams) {
  const { response } = await requireAllowedUser();
  if (response) return response;

  try {
    const id = (await resolveId(request, params)).trim();
    const person = await getPersonById(id);
    if (!person) {
      const hint = isUuid(id)
        ? "Confira se o person_id no Sheets esta como texto."
        : "person_id invalido.";
      return NextResponse.json(
        { ok: false, error: `Pessoa nao encontrada. ${hint}` },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, data: person });
  } catch (error) {
    return handleApiError(error, "people:get");
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { session, response } = await requireAllowedUser();
  if (response) return response;

  const rate = checkRateLimit(request, {
    key: "people:update",
    limit: 30,
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
    const id = (await resolveId(request, params)).trim();
    const person = await updatePerson(
      id,
      parsed.data,
      getActorEmail(session)
    );
    return NextResponse.json({ ok: true, data: person });
  } catch (error) {
    return handleApiError(error, "people:update");
  }
}
