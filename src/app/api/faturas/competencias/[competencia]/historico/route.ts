import { NextResponse } from "next/server";
import { requireAllowedUser, handleApiError } from "@/server/payments/api-utils";
import { listFaturasContratosByCompetencia } from "@/server/faturas/storage";

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
    const data = await listFaturasContratosByCompetencia(competencia);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
