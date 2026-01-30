import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAllowedEmail } from "@/lib/auth";
import { listLoads } from "@/server/loads";

const parseNumber = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAllowedEmail(session?.user?.email)) {
    return NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const numero_cartao = searchParams.get("numero_cartao") ?? undefined;
  const marca = searchParams.get("marca") ?? undefined;
  const unidade = searchParams.get("unidade") ?? undefined;
  const limit = parseNumber(searchParams.get("limit"), 10);
  const offset = parseNumber(searchParams.get("offset"), 0);

  try {
    const result = await listLoads({
      from,
      to,
      numero_cartao,
      marca,
      unidade,
      limit,
      offset,
    });
    return NextResponse.json({
      ok: true,
      data: result.rows,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Erro ao listar cargas.", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao listar cargas." },
      { status: 500 }
    );
  }
}
