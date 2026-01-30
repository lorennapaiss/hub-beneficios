import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser, handleApiError } from "@/server/payments/api-utils";
import { ConfigSchema } from "@/lib/schema";
import { SHEETS } from "@/config/payments-constants";
import { CONFIG_COLUMNS } from "@/server/payments/sheets-schema";
import { getConfig, upsertConfig } from "@/server/payments/sheets";
import { getRowRange, getSheetRange } from "@/server/payments/sheets-utils";
import { sanitizeObject } from "@/server/payments/sanitize";

const patchSchema = ConfigSchema.partial();

export async function GET() {
  const { response } = await requireAdminUser();
  if (response) return response;

  try {
    const range = getSheetRange(SHEETS.CONFIG, CONFIG_COLUMNS.length);
    const config = await getConfig(process.env.PAYMENTS_SHEETS_ID ?? "", range);

    return NextResponse.json({ data: config ?? ConfigSchema.parse({}) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  const { response } = await requireAdminUser();
  if (response) return response;

  try {
    const body = await request.json();
    const patch = patchSchema.parse(sanitizeObject(body));

    const range = getSheetRange(SHEETS.CONFIG, CONFIG_COLUMNS.length);
    const rowRange = getRowRange(SHEETS.CONFIG, 2, CONFIG_COLUMNS.length);
    const existing = await getConfig(process.env.PAYMENTS_SHEETS_ID ?? "", range);

    const updated = ConfigSchema.parse({
      ...existing,
      ...patch,
      id: "global",
    });

    await upsertConfig(
      process.env.PAYMENTS_SHEETS_ID ?? "",
      range,
      rowRange,
      updated,
    );

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return handleApiError(error);
  }
}
