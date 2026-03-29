import { NextResponse } from "next/server";
import { listLoads } from "@/server/loads";
import { requireAllowedUser, parseNumber, handleApiError } from "@/server/api-utils";

export async function GET(request: Request) {
  const { response } = await requireAllowedUser();
  if (response) return response;

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
    return handleApiError(error, "loads");
  }
}
