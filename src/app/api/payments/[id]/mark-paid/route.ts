import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAllowedUser, handleApiError } from "@/server/payments/api-utils";
import { SHEETS } from "@/config/payments-constants";
import {
  PAYMENTS_COLUMNS,
  AUDIT_LOG_COLUMNS,
  rowToPayment,
} from "@/server/payments/sheets-schema";
import {
  findPaymentRowById,
  updatePaymentRow,
  appendAuditLog,
} from "@/server/payments/sheets";
import { getSheetRange, getRowRange } from "@/server/payments/sheets-utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response, actorRole } = await requireAllowedUser();
  if (response) return response;

  try {
    const { id } = await params;
    const range = getSheetRange(SHEETS.PAYMENTS, PAYMENTS_COLUMNS.length);
    const result = await findPaymentRowById(
      process.env.PAYMENTS_SHEETS_ID ?? "",
      range,
      id,
    );

    if (!result?.row || !result.rowNumber) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const payment = rowToPayment(result.row as string[]);
    const nextStatus = "PAGO";

    // Permite mudança livre de status (sem ordem).

    const now = new Date().toISOString();
    const updated = {
      ...payment,
      status: nextStatus,
      paid_at: now,
      paid_by: session?.user?.email ?? "",
      updated_at: now,
    };

    const rowRange = getRowRange(
      SHEETS.PAYMENTS,
      result.rowNumber,
      PAYMENTS_COLUMNS.length,
    );

    await updatePaymentRow(
      process.env.PAYMENTS_SHEETS_ID ?? "",
      rowRange,
      updated,
    );

    await appendAuditLog(
      process.env.PAYMENTS_SHEETS_ID ?? "",
      getSheetRange(SHEETS.AUDIT_LOGS, AUDIT_LOG_COLUMNS.length),
      {
        id: randomUUID(),
        entity_type: "PAYMENT",
        entity_id: updated.id,
        action: "MARK_PAID",
        before: JSON.stringify(payment),
        after: JSON.stringify(updated),
        actor_email: session?.user?.email ?? "",
        actor_role: actorRole,
        created_at: now,
      },
    );

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
