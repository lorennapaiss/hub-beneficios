import { NextResponse } from "next/server";
import { handleApiError, requireAdminUser } from "@/server/api-utils";
import { importIndicatorAccessFromSheets } from "@/server/indicators/access-migration";

export async function POST() {
  const { response } = await requireAdminUser();
  if (response) return response;

  try {
    const result = await importIndicatorAccessFromSheets();
    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleApiError(error, "admin:indicators:access:import-from-sheets");
  }
}
