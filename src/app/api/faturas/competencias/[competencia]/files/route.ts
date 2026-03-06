import { NextResponse } from "next/server";
import { requireAllowedUser, handleApiError } from "@/server/payments/api-utils";
import { listFaturaFilesByCompetencia } from "@/server/faturas/drive";

type RouteContext = {
  params: Promise<{
    competencia: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  const { response } = await requireAllowedUser();
  if (response) return response;

  try {
    const { competencia: rawCompetencia } = await params;
    const competencia = decodeURIComponent(rawCompetencia ?? "");
    const files = await listFaturaFilesByCompetencia(competencia);
    return NextResponse.json({ data: files });
  } catch (error) {
    return handleApiError(error);
  }
}
