import { NextResponse } from "next/server";
import {
  getIndicatorDetailData,
  type IndicatorDetailByBenefit,
} from "@/server/indicators/dashboard";
import {
  logIndicatorsAuthorizationEvent,
  requireIndicatorsAccess,
} from "@/server/indicators/access";
import { handleApiError } from "@/server/payments/api-utils";

const isBenefitKey = (value: string): value is keyof IndicatorDetailByBenefit =>
  ["health", "dental", "transport", "meal"].includes(value);

export async function GET(
  _request: Request,
  context: { params: Promise<{ benefit: string }> },
) {
  const { session, scope, response } = await requireIndicatorsAccess();
  if (response) return response;

  try {
    const { benefit } = await context.params;
    if (!isBenefitKey(benefit)) {
      return NextResponse.json({ error: "Beneficio invalido." }, { status: 400 });
    }

    const data =
      benefit === "health"
        ? await getIndicatorDetailData("health", scope)
        : benefit === "dental"
          ? await getIndicatorDetailData("dental", scope)
          : benefit === "meal"
            ? await getIndicatorDetailData("meal", scope)
            : await getIndicatorDetailData("transport", scope);

    await logIndicatorsAuthorizationEvent({
      action: "INDICATORS_ACCESS_GRANTED",
      createdBy: session?.user?.email ?? scope?.email ?? "unknown",
      metadata: {
        path: `/api/indicators/${benefit}`,
        role: scope?.isAdmin ? "ADMIN" : "BRAND_SCOPE",
        allowedBrands: scope?.allowedBrands ?? [],
      },
    });

    return NextResponse.json({
      data,
      meta: {
        benefit,
        cache: "scoped",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
