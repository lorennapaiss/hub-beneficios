import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { requireAllowedUser, handleApiError } from "@/server/payments/api-utils";
import { PaymentBaseSchema, PaymentStatusEnum, computeAutoStatus } from "@/lib/schema";
import { SHEETS } from "@/config/payments-constants";
import {
  PAYMENTS_COLUMNS,
  AUDIT_LOG_COLUMNS,
  rowToPayment,
} from "@/server/payments/sheets-schema";
import { appendPaymentRow, getPayments, appendAuditLog } from "@/server/payments/sheets";
import { getSheetRange } from "@/server/payments/sheets-utils";
import { sanitizeObject } from "@/server/payments/sanitize";

const createSchema = PaymentBaseSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  paid_at: true,
  paid_by: true,
})
  .extend({
    status: PaymentStatusEnum.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.provider === "Outro" && !data.provider_custom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "provider_custom e obrigatorio quando provider=Outro",
        path: ["provider_custom"],
      });
    }
  });

type PaymentRecord = z.infer<typeof PaymentBaseSchema>;

const normalizePayment = (payment: PaymentRecord) => ({
  ...payment,
  status: computeAutoStatus(payment.due_date, payment.status),
});

const matchesQuery = (payment: PaymentRecord, query: string) => {
  const haystack = [
    payment.ticket_number,
    payment.owner_name,
    payment.owner_email,
    payment.provider,
    payment.provider_custom,
    payment.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
};

export async function GET(request: Request) {
  const { response } = await requireAllowedUser();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const provider = searchParams.get("provider");
    const competence = searchParams.get("competence");
    const owner = searchParams.get("owner");
    const q = searchParams.get("q");

    const range = getSheetRange(SHEETS.PAYMENTS, PAYMENTS_COLUMNS.length);
    const values = await getPayments(process.env.PAYMENTS_SHEETS_ID ?? "", range);

    const rows = values.slice(1);
    const payments = rows
      .map((row) => rowToPayment(row as string[]))
      .map((payment) => normalizePayment(payment as PaymentRecord))
      .filter((payment) => {
        if (status && payment.status !== status) return false;
        if (category && payment.category !== category) return false;
        if (provider && payment.provider !== provider) return false;
        if (competence && payment.competence !== competence) return false;
        if (owner) {
          const ownerLower = owner.toLowerCase();
          const matchesOwner =
            payment.owner_name?.toLowerCase().includes(ownerLower) ||
            payment.owner_email?.toLowerCase().includes(ownerLower);
          if (!matchesOwner) return false;
        }
        if (q && !matchesQuery(payment as PaymentRecord, q)) return false;
        return true;
      });

    return NextResponse.json({ data: payments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const { session, response, actorRole } = await requireAllowedUser();
  if (response) return response;

  try {
    const body = await request.json();
    const payload = createSchema.parse(sanitizeObject(body));

    const now = new Date().toISOString();
    const payment: PaymentRecord = {
      ...payload,
      id: randomUUID(),
      status: payload.status ?? "RASCUNHO",
      created_at: now,
      updated_at: now,
      paid_at: payload.status === "PAGO" ? now : undefined,
      paid_by: payload.status === "PAGO" ? session?.user?.email ?? "" : undefined,
    } as PaymentRecord;

    const range = getSheetRange(SHEETS.PAYMENTS, PAYMENTS_COLUMNS.length);
    const appendResult = await appendPaymentRow(
      process.env.PAYMENTS_SHEETS_ID ?? "",
      range,
      payment as Record<string, unknown>,
    );

    await appendAuditLog(
      process.env.PAYMENTS_SHEETS_ID ?? "",
      getSheetRange(SHEETS.AUDIT_LOGS, AUDIT_LOG_COLUMNS.length),
      {
        id: randomUUID(),
        entity_type: "PAYMENT",
        entity_id: payment.id,
        action: "CREATE",
        after: JSON.stringify(payment),
        actor_email: session?.user?.email ?? "",
        actor_role: actorRole,
        created_at: now,
      },
    );

    return NextResponse.json({ data: payment, meta: appendResult }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return handleApiError(error);
  }
}

