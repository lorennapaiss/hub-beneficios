import { NextResponse } from "next/server";
import { requireAllowedUser, handleApiError } from "@/server/payments/api-utils";
import { SHEETS } from "@/config/payments-constants";
import { AUDIT_LOG_COLUMNS, rowToAudit } from "@/server/payments/sheets-schema";
import { getPayments } from "@/server/payments/sheets";
import { getSheetRange } from "@/server/payments/sheets-utils";

export async function GET(request: Request) {
  const { response } = await requireAllowedUser();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("payment_id");

    const range = getSheetRange(SHEETS.AUDIT_LOGS, AUDIT_LOG_COLUMNS.length);
    const values = await getPayments(process.env.PAYMENTS_SHEETS_ID ?? "", range);

    const rows = values.slice(1);
    const logs = rows
      .map((row) => rowToAudit(row as string[]))
      .filter((log) => {
        if (!paymentId) return true;
        return log.entity_type === "PAYMENT" && log.entity_id === paymentId;
      });

    return NextResponse.json({ data: logs });
  } catch (error) {
    return handleApiError(error);
  }
}
