import { NextResponse } from "next/server";
import { requireAllowedUser, handleApiError } from "@/server/payments/api-utils";
import { listFaturasExecucoesByCompetencia } from "@/server/faturas/executions";

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
    const data = await listFaturasExecucoesByCompetencia(competencia);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
