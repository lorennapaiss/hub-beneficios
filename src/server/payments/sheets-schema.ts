export const PAYMENTS_COLUMNS = [
  "id",
  "category",
  "brand",
  "provider",
  "provider_custom",
  "subtype",
  "competence",
  "ticket_number",
  "ticket_sent_date",
  "due_date",
  "amount",
  "status",
  "owner_name",
  "owner_email",
  "drive_file_id",
  "drive_link",
  "drive_filename",
  "created_at",
  "updated_at",
  "paid_at",
  "paid_by",
  "notes",
] as const;

export const AUDIT_LOG_COLUMNS = [
  "id",
  "entity_type",
  "entity_id",
  "action",
  "before",
  "after",
  "actor_email",
  "actor_role",
  "created_at",
  "metadata",
] as const;

export const REMINDER_LEDGER_COLUMNS = [
  "id",
  "payment_id",
  "due_date",
  "status_at_run",
  "reminder_type",
  "sent_to",
  "sent_at",
  "run_id",
  "result",
  "error",
] as const;

export const CONFIG_COLUMNS = [
  "id",
  "allowed_domains",
  "allowed_emails",
  "admin_emails",
  "google_sheets_id",
  "google_drive_folder_id",
  "root_drive_folder_id",
  "team_emails",
  "reminder_days_before",
  "reminder_daily_hour",
  "reminder_d3_enabled",
  "reminder_d1_enabled",
  "reminder_d0_enabled",
  "reminder_overdue_enabled",
  "reminder_overdue_every_days",
  "timezone",
  "last_reminder_run_at",
] as const;

export type PaymentRow = (string | number | null | undefined)[];

const toCellValue = (value: unknown): string | number => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value;
  if (typeof value === "string") return value;
  return String(value);
};

export const paymentToRow = (payment: Record<string, unknown>): PaymentRow => [
  toCellValue(payment.id),
  toCellValue(payment.category),
  toCellValue(payment.brand),
  toCellValue(payment.provider),
  toCellValue(payment.provider_custom),
  toCellValue(payment.subtype),
  toCellValue(payment.competence),
  toCellValue(payment.ticket_number),
  toCellValue(payment.ticket_sent_date),
  toCellValue(payment.due_date),
  toCellValue(payment.amount),
  toCellValue(payment.status),
  toCellValue(payment.owner_name),
  toCellValue(payment.owner_email),
  toCellValue(payment.drive_file_id),
  toCellValue(payment.drive_link),
  toCellValue(payment.drive_filename),
  toCellValue(payment.created_at),
  toCellValue(payment.updated_at),
  toCellValue(payment.paid_at),
  toCellValue(payment.paid_by),
  toCellValue(payment.notes),
];

export const rowToPayment = (row: string[]) => ({
  id: row[0] || undefined,
  category: row[1] || undefined,
  brand: row[2] || undefined,
  provider: row[3] || undefined,
  provider_custom: row[4] || undefined,
  subtype: row[5] || undefined,
  competence: row[6] || undefined,
  ticket_number: row[7] || undefined,
  ticket_sent_date: row[8] || undefined,
  due_date: row[9] || undefined,
  amount: row[10] ? Number(row[10]) : undefined,
  status: row[11] || undefined,
  owner_name: row[12] || undefined,
  owner_email: row[13] || undefined,
  drive_file_id: row[14] || undefined,
  drive_link: row[15] || undefined,
  drive_filename: row[16] || undefined,
  created_at: row[17] || undefined,
  updated_at: row[18] || undefined,
  paid_at: row[19] || undefined,
  paid_by: row[20] || undefined,
  notes: row[21] || undefined,
});

export const auditToRow = (log: Record<string, unknown>) => [
  log.id ?? "",
  log.entity_type ?? "",
  log.entity_id ?? "",
  log.action ?? "",
  log.before ?? "",
  log.after ?? "",
  log.actor_email ?? "",
  log.actor_role ?? "",
  log.created_at ?? "",
  log.metadata ?? "",
];

export const rowToAudit = (row: string[]) => ({
  id: row[0] || undefined,
  entity_type: row[1] || undefined,
  entity_id: row[2] || undefined,
  action: row[3] || undefined,
  before: row[4] || undefined,
  after: row[5] || undefined,
  actor_email: row[6] || undefined,
  actor_role: row[7] || undefined,
  created_at: row[8] || undefined,
  metadata: row[9] || undefined,
});

export const reminderToRow = (log: Record<string, unknown>) => [
  log.id ?? "",
  log.payment_id ?? "",
  log.due_date ?? "",
  log.status_at_run ?? "",
  log.reminder_type ?? "",
  log.sent_to ?? "",
  log.sent_at ?? "",
  log.run_id ?? "",
  log.result ?? "",
  log.error ?? "",
];

export const rowToReminder = (row: string[]) => ({
  id: row[0] || undefined,
  payment_id: row[1] || undefined,
  due_date: row[2] || undefined,
  status_at_run: row[3] || undefined,
  reminder_type: row[4] || undefined,
  sent_to: row[5] || undefined,
  sent_at: row[6] || undefined,
  run_id: row[7] || undefined,
  result: row[8] || undefined,
  error: row[9] || undefined,
});

export const configToRow = (config: Record<string, unknown>) => [
  config.id ?? "global",
  config.allowed_domains ?? "",
  config.allowed_emails ?? "",
  config.admin_emails ?? "",
  config.google_sheets_id ?? "",
  config.google_drive_folder_id ?? "",
  config.root_drive_folder_id ?? "",
  config.team_emails ?? "",
  config.reminder_days_before ?? "",
  config.reminder_daily_hour ?? "",
  config.reminder_d3_enabled ?? "",
  config.reminder_d1_enabled ?? "",
  config.reminder_d0_enabled ?? "",
  config.reminder_overdue_enabled ?? "",
  config.reminder_overdue_every_days ?? "",
  config.timezone ?? "",
  config.last_reminder_run_at ?? "",
];

export const rowToConfig = (row: string[]) => ({
  id: row[0] || "global",
  allowed_domains: row[1] || "",
  allowed_emails: row[2] || "",
  admin_emails: row[3] || "",
  google_sheets_id: row[4] || "",
  google_drive_folder_id: row[5] || "",
  root_drive_folder_id: row[6] || "",
  team_emails: row[7] || "",
  reminder_days_before: row[8] ? Number(row[8]) : 3,
  reminder_daily_hour: row[9] ? Number(row[9]) : 9,
  reminder_d3_enabled: row[10] ? row[10] === "true" || row[10] === "1" : true,
  reminder_d1_enabled: row[11] ? row[11] === "true" || row[11] === "1" : true,
  reminder_d0_enabled: row[12] ? row[12] === "true" || row[12] === "1" : true,
  reminder_overdue_enabled: row[13]
    ? row[13] === "true" || row[13] === "1"
    : true,
  reminder_overdue_every_days: row[14] ? Number(row[14]) : 1,
  timezone: row[15] || "America/Sao_Paulo",
  last_reminder_run_at: row[16] || undefined,
});
