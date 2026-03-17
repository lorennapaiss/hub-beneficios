import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAllowedEmail } from "@/lib/auth";
import { importPjsFromCsvBuffer } from "@/server/pj-import";
import { checkRateLimit } from "@/server/rate-limit";

const getActorEmail = (email?: string | null) => email ?? "unknown";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAllowedEmail(session?.user?.email)) {
    return NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 403 });
  }

  const rate = checkRateLimit(request, {
    key: "pjs:import",
    limit: 5,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas requisicoes. Tente novamente." },
      { status: 429 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Envie um arquivo CSV." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importPjsFromCsvBuffer(buffer, getActorEmail(session?.user?.email));
    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao importar CSV.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
