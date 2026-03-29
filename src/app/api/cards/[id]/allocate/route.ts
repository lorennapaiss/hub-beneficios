import { NextResponse } from "next/server";
import { requireAllowedUser, getActorEmail, handleApiError } from "@/server/api-utils";
import { AllocationInputSchema } from "@/lib/schemas/allocation";
import { getCardById } from "@/server/cards";
import { createAllocation } from "@/server/allocations";
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

export async function POST(request: Request, { params }: RouteParams) {
  const { session, response } = await requireAllowedUser();
  if (response) return response;

  const rate = checkRateLimit(request, {
    key: "cards:allocate",
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
  const parsed = AllocationInputSchema.safeParse(body);
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

    const result = await createAllocation(card, parsed.data, getActorEmail(session));
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return handleApiError(error, "cards:allocate");
  }
}
