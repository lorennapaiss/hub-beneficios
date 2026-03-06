import { NextResponse } from "next/server";
import { requireAllowedUser, handleApiError } from "@/server/payments/api-utils";
import { processarCompetenciaSulamerica } from "@/server/faturas/processamento";

type RouteContext = {
  params: Promise<{
    competencia: string;
  }>;
};

export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  const { response, session } = await requireAllowedUser();
  if (response) return response;

  try {
    const { competencia: rawCompetencia } = await params;
    const competencia = decodeURIComponent(rawCompetencia ?? "");
    const resultado = await processarCompetenciaSulamerica(competencia, {
      email: session?.user?.email,
      name: session?.user?.name,
    });
    return NextResponse.json({ data: resultado });
  } catch (error) {
    return handleApiError(error);
  }
}
