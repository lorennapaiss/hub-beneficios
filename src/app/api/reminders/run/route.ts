import { NextResponse } from "next/server";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { randomUUID } from "crypto";
import { SHEETS } from "@/config/payments-constants";
import { computeAutoStatus, ConfigSchema } from "@/lib/schema";
import {
  PAYMENTS_COLUMNS,
  AUDIT_LOG_COLUMNS,
  REMINDER_LEDGER_COLUMNS,
  CONFIG_COLUMNS,
  rowToPayment,
  rowToReminder,
} from "@/server/payments/sheets-schema";
import {
  appendAuditLog,
  appendReminderLedger,
  getPayments,
  getConfig,
} from "@/server/payments/sheets";
import { getSheetRange } from "@/server/payments/sheets-utils";
import { checkRateLimit } from "@/server/rate-limit";
import { handleApiError } from "@/server/payments/api-utils";

const REMINDER_TYPES = ["D-3", "D-1", "D0", "OVERDUE"] as const;

type ReminderType = (typeof REMINDER_TYPES)[number];

type PaymentRow = {
  id?: string;
  owner_email?: string;
  owner_name?: string;
  category?: string;
  provider?: string;
  competence?: string;
  ticket_number?: string;
  due_date?: string;
  amount?: number;
  status?: string;
};

const getReminderType = (
  payment: PaymentRow,
  today: Date,
  config: ReturnType<typeof ConfigSchema.parse>,
): ReminderType | null => {
  if (!payment.due_date) return null;
  const due = parseISO(payment.due_date);
  const daysDiff = differenceInCalendarDays(due, today);

  if (daysDiff === 3 && config.reminder_d3_enabled) return "D-3";
  if (daysDiff === 1 && config.reminder_d1_enabled) return "D-1";
  if (daysDiff === 0 && config.reminder_d0_enabled) return "D0";

  if (daysDiff < 0 && config.reminder_overdue_enabled) {
    const overdueDays = Math.abs(daysDiff);
    const frequency = Math.max(1, config.reminder_overdue_every_days ?? 1);
    if (overdueDays % frequency === 0) return "OVERDUE";
  }

  return null;
};

const listEmails = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const buildEmail = (payment: PaymentRow, reminderType: ReminderType) => {
  const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "";
  const detailsUrl = payment.id
    ? `${baseUrl}/beneficios/pagamentos/${payment.id}`
    : baseUrl;

  const subject = `[Benefícios] Lembrete ${reminderType} - ${payment.category ?? "Pagamento"}`;

  const body = [
    `Ola ${payment.owner_name ?? ""},`,
    "",
    `Este e um lembrete para o pagamento do ticket ${payment.ticket_number ?? "-"}.`,
    `Categoria: ${payment.category ?? "-"}`,
    `Fornecedor: ${payment.provider ?? "-"}`,
    `Competencia: ${payment.competence ?? "-"}`,
    `Vencimento: ${payment.due_date ?? "-"}`,
    `Status: ${payment.status ?? "-"}`,
    "",
    `Acesse o detalhe: ${detailsUrl}`,
    "",
    "Obrigado.",
  ].join("\n");

  return { subject, body };
};

const sendEmail = async (
  to: string[],
  cc: string[],
  subject: string,
  text: string,
) => {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "no-reply@controle.local";

  if (resendKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        cc,
        subject,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend error: ${errorText}`);
    }

    return;
  }

  console.log("[reminder] DEV email", { to, cc, subject });
};

export async function POST(request: Request) {
  const secretHeader = request.headers.get("x-cron-secret");
  const authHeader = request.headers.get("authorization");
  const providedSecret =
    secretHeader ||
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "");

  if (
    !process.env.REMINDER_CRON_SECRET ||
    providedSecret !== process.env.REMINDER_CRON_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limiter = checkRateLimit(request, {
    key: "payments-reminders",
    limit: 5,
    windowMs: 60_000,
  });
  if (!limiter.ok) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  const sheetId = process.env.PAYMENTS_SHEETS_ID ?? "";
  const now = new Date();
  const todayKey = format(now, "yyyy-MM-dd");

  try {
    const paymentsRange = getSheetRange(
      SHEETS.PAYMENTS,
      PAYMENTS_COLUMNS.length,
    );
    const ledgerRange = getSheetRange(
      SHEETS.REMINDER_LEDGER,
      REMINDER_LEDGER_COLUMNS.length,
    );
    const configRange = getSheetRange(SHEETS.CONFIG, CONFIG_COLUMNS.length);

    const [paymentsValues, ledgerValues, configValue] = await Promise.all([
      getPayments(sheetId, paymentsRange),
      getPayments(sheetId, ledgerRange),
      getConfig(sheetId, configRange),
    ]);

    const config = ConfigSchema.parse(configValue ?? {});

    const payments = paymentsValues
      .slice(1)
      .map((row) => rowToPayment(row as string[]))
      .filter((payment) => payment.status !== "PAGO");

    const ledger = ledgerValues
      .slice(1)
      .map((row) => rowToReminder(row as string[]));

    const ledgerIndex = new Set(
      ledger
        .filter((item) => item.payment_id && item.reminder_type && item.sent_at)
        .map(
          (item) =>
            `${item.payment_id}-${item.reminder_type}-${item.sent_at?.slice(0, 10)}`,
        ),
    );

    const teamCc = listEmails(config.team_emails || process.env.TEAM_EMAILS);
    const result: Array<{
      paymentId: string;
      reminderType: ReminderType;
      status: string;
    }> = [];

    for (const payment of payments) {
      const paymentWithStatus = {
        ...payment,
        status: computeAutoStatus(payment.due_date, payment.status),
      } as PaymentRow;

      const reminderType = getReminderType(paymentWithStatus, now, config);
      if (!reminderType) continue;

      if (!paymentWithStatus.owner_email) {
        result.push({
          paymentId: paymentWithStatus.id ?? "",
          reminderType,
          status: "SKIPPED_NO_OWNER",
        });
        continue;
      }

      const key = `${paymentWithStatus.id}-${reminderType}-${todayKey}`;
      if (ledgerIndex.has(key)) {
        result.push({
          paymentId: paymentWithStatus.id ?? "",
          reminderType,
          status: "SKIPPED_ALREADY_SENT",
        });
        continue;
      }

      const { subject, body } = buildEmail(paymentWithStatus, reminderType);

      try {
        await sendEmail([paymentWithStatus.owner_email], teamCc, subject, body);

        const sentAt = new Date().toISOString();
        await appendReminderLedger(sheetId, ledgerRange, {
          id: randomUUID(),
          payment_id: paymentWithStatus.id,
          due_date: paymentWithStatus.due_date,
          status_at_run: paymentWithStatus.status,
          reminder_type: reminderType,
          sent_to: [paymentWithStatus.owner_email, ...teamCc].join(","),
          sent_at: sentAt,
          run_id: todayKey,
          result: "SENT",
          error: "",
        });

        await appendAuditLog(
          sheetId,
          getSheetRange(SHEETS.AUDIT_LOGS, AUDIT_LOG_COLUMNS.length),
          {
            id: randomUUID(),
            entity_type: "REMINDER_RUN",
            entity_id: paymentWithStatus.id,
            action: "RUN",
            after: JSON.stringify({
              reminderType,
              sent_at: sentAt,
              to: paymentWithStatus.owner_email,
            }),
            actor_email: "system",
            actor_role: "ADMIN",
            created_at: sentAt,
            metadata: JSON.stringify({ reminderType }),
          },
        );

        ledgerIndex.add(key);
        result.push({
          paymentId: paymentWithStatus.id ?? "",
          reminderType,
          status: "SENT",
        });
      } catch (error) {
        const sentAt = new Date().toISOString();
        await appendReminderLedger(sheetId, ledgerRange, {
          id: randomUUID(),
          payment_id: paymentWithStatus.id,
          due_date: paymentWithStatus.due_date,
          status_at_run: paymentWithStatus.status,
          reminder_type: reminderType,
          sent_to: [paymentWithStatus.owner_email, ...teamCc].join(","),
          sent_at: sentAt,
          run_id: todayKey,
          result: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
        });

        result.push({
          paymentId: paymentWithStatus.id ?? "",
          reminderType,
          status: "FAILED",
        });
      }
    }

    return NextResponse.json({
      data: {
        date: todayKey,
        total: result.length,
        results: result,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
