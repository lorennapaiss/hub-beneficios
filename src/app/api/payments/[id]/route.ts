import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { requireAllowedUser, handleApiError } from "@/server/payments/api-utils";
import {
  PaymentBaseSchema,
  PaymentStatusEnum,
  computeAutoStatus,
} from "@/lib/schema";
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
import { sanitizeObject } from "@/server/payments/sanitize";

const patchSchema = PaymentBaseSchema.partial()
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    paid_at: true,
    paid_by: true,
  })
  .extend({
    status: PaymentStatusEnum.optional(),
  });

type PaymentRecord = z.infer<typeof PaymentBaseSchema>;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAllowedUser();
  if (response) return response;

  try {
    const { id } = await params;
    const range = getSheetRange(SHEETS.PAYMENTS, PAYMENTS_COLUMNS.length);
    const result = await findPaymentRowById(
      process.env.PAYMENTS_SHEETS_ID ?? "",
      range,
      id,
    );

    if (!result?.row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const payment = rowToPayment(result.row as string[]) as PaymentRecord;
    const normalized = {
      ...payment,
      status: computeAutoStatus(payment.due_date, payment.status),
    };

    return NextResponse.json({ data: normalized });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
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

    const existing = rowToPayment(result.row as string[]) as PaymentRecord;
    const body = await request.json();
    const patch = patchSchema.parse(sanitizeObject(body));

    // Permite mudança livre de status (sem ordem).

    const now = new Date().toISOString();
    const updated: PaymentRecord = {
      ...existing,
      ...patch,
      updated_at: now,
    } as PaymentRecord;

    if (patch.status === "PAGO") {
      updated.paid_at = now;
      updated.paid_by = session?.user?.email ?? "";
    }

    const rowRange = getRowRange(
      SHEETS.PAYMENTS,
      result.rowNumber,
      PAYMENTS_COLUMNS.length,
    );

    await updatePaymentRow(
      process.env.PAYMENTS_SHEETS_ID ?? "",
      rowRange,
      updated as Record<string, unknown>,
    );

    await appendAuditLog(
      process.env.PAYMENTS_SHEETS_ID ?? "",
      getSheetRange(SHEETS.AUDIT_LOGS, AUDIT_LOG_COLUMNS.length),
      {
        id: randomUUID(),
        entity_type: "PAYMENT",
        entity_id: updated.id,
        action: "UPDATE",
        before: JSON.stringify(existing),
        after: JSON.stringify(updated),
        actor_email: session?.user?.email ?? "",
        actor_role: actorRole,
        created_at: now,
      },
    );

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return handleApiError(error);
  }
}

