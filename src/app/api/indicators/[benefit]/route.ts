import { NextResponse } from "next/server";
import {
  getIndicatorDetailData,
  type IndicatorDetailByBenefit,
} from "@/server/indicators/dashboard";
import { handleApiError, requireAllowedUser } from "@/server/payments/api-utils";

const isBenefitKey = (value: string): value is keyof IndicatorDetailByBenefit =>
  ["health", "dental", "transport", "meal"].includes(value);

export async function GET(
  _request: Request,
  context: { params: Promise<{ benefit: string }> },
) {
  const { response } = await requireAllowedUser();
  if (response) return response;

  try {
    const { benefit } = await context.params;
    if (!isBenefitKey(benefit)) {
      return NextResponse.json({ error: "Beneficio invalido." }, { status: 400 });
    }

    const data = await getIndicatorDetailData(benefit);

    return NextResponse.json({
      data,
      meta: {
        benefit,
        cache: "hit",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
