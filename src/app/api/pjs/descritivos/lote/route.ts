import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAllowedEmail } from "@/lib/auth";
import { generatePjHealthDescriptiveBatch } from "@/server/pj-health-descriptive";
import { checkRateLimit } from "@/server/rate-limit";

const getActorEmail = (email?: string | null) => email ?? "unknown";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAllowedEmail(session?.user?.email)) {
    return NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 403 });
  }

  const rate = checkRateLimit(request, {
    key: "pjs:descritivo:lote",
    limit: 5,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas requisicoes. Tente novamente." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const competencia = String(body.competencia ?? "").trim();
  if (!competencia) {
    return NextResponse.json(
      { ok: false, error: "Informe a competencia no formato AAAA-MM." },
      { status: 400 },
    );
  }

  try {
    const result = await generatePjHealthDescriptiveBatch(
      competencia,
      getActorEmail(session?.user?.email),
    );
    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao gerar lote.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
