import { NextResponse } from "next/server";
import { requireAllowedUser, handleApiError } from "@/server/payments/api-utils";
import { SHEETS } from "@/config/payments-constants";
import { AUDIT_LOG_COLUMNS, rowToAudit } from "@/server/payments/sheets-schema";
import { getPayments } from "@/server/payments/sheets";
import { getSheetRange } from "@/server/payments/sheets-utils";
import { parseNumber } from "@/server/api-utils";

export async function GET(request: Request) {
  const { response } = await requireAllowedUser();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("payment_id");
    const limit = parseNumber(searchParams.get("limit"), 100);
    const offset = parseNumber(searchParams.get("offset"), 0);

    const range = getSheetRange(SHEETS.AUDIT_LOGS, AUDIT_LOG_COLUMNS.length);
    const values = await getPayments(process.env.PAYMENTS_SHEETS_ID ?? "", range);

    const rows = values.slice(1);
    let logs = rows
      .map((row) => rowToAudit(row as string[]))
      .filter((log) => {
        if (!paymentId) return true;
        return log.entity_type === "PAYMENT" && log.entity_id === paymentId;
      });

    logs.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

    const total = logs.length;
    logs = logs.slice(offset, offset + limit);

    return NextResponse.json({ data: logs, total, limit, offset });
  } catch (error) {
    return handleApiError(error);
  }
}
