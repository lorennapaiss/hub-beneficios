import { z } from "zod";
import { isBefore, parseISO, startOfDay } from "date-fns";

export const PaymentStatusEnum = z.enum([
  "RASCUNHO",
  "EM_ACOMPANHAMENTO",
  "AGUARDANDO_PAGAMENTO",
  "PAGO",
  "ATRASADO",
]);

export const PaymentCategoryEnum = z.enum([
  "PlanoSaude",
  "VT",
  "VA",
  "ExameOcupacional",
]);

export const PaymentProviderEnum = z.enum([
  "Unimed",
  "SulAmerica",
  "Amil",
  "Outro",
]);

export const PaymentSubtypeEnum = z.enum(["Saude", "Odonto", "NA"]);

export const competenceSchema = z
  .string()
  .regex(/^[0-9]{4}-(0[1-9]|1[0-2])$/, "Competencia deve ser AAAA-MM");

export const PaymentBaseSchema = z.object({
  id: z.string().uuid().optional(),
  category: PaymentCategoryEnum,
  brand: z.string().trim().min(1, "marca e obrigatoria"),
  provider: PaymentProviderEnum,
  provider_custom: z.string().trim().optional(),
  subtype: PaymentSubtypeEnum,
  competence: competenceSchema.optional(),
  ticket_number: z.string().trim().min(1, "ticket_number e obrigatorio"),
  ticket_sent_date: z.string().min(1, "ticket_sent_date e obrigatorio"),
  due_date: z.string().min(1, "due_date e obrigatorio"),
  amount: z.number().nonnegative().optional(),
  status: PaymentStatusEnum,
  owner_name: z.string().trim().min(1, "owner_name e obrigatorio"),
  owner_email: z.string().email("owner_email invalido"),
  drive_file_id: z.string().trim().optional(),
  drive_link: z.string().trim().url().optional(),
  drive_filename: z.string().trim().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  paid_at: z.string().optional(),
  paid_by: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const PaymentSchema = PaymentBaseSchema.superRefine((data, ctx) => {
  if (data.provider === "Outro" && !data.provider_custom) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "provider_custom e obrigatorio quando provider=Outro",
      path: ["provider_custom"],
    });
  }
});

export const AuditLogSchema = z.object({
  id: z.string().uuid().optional(),
  entity_type: z.enum(["PAYMENT", "CONFIG", "REMINDER_RUN"]),
  entity_id: z.string().min(1),
  action: z.enum(["CREATE", "UPDATE", "DELETE", "MARK_PAID", "UPLOAD", "RUN"]),
  before: z.string().optional(),
  after: z.string().optional(),
  actor_email: z.string().email(),
  actor_role: z.enum(["ADMIN", "USER"]),
  created_at: z.string().min(1),
  metadata: z.string().optional(),
});

export const ReminderLedgerSchema = z.object({
  id: z.string().uuid().optional(),
  payment_id: z.string().min(1),
  due_date: z.string().min(1),
  status_at_run: PaymentStatusEnum,
  reminder_type: z.enum(["D-3", "D-1", "D0", "OVERDUE"]),
  sent_to: z.string().min(1),
  sent_at: z.string().min(1),
  run_id: z.string().min(1),
  result: z.enum(["SENT", "SKIPPED", "FAILED"]),
  error: z.string().optional(),
});

export const ConfigSchema = z.object({
  id: z.literal("global").default("global"),
  allowed_domains: z.string().default(""),
  allowed_emails: z.string().default(""),
  admin_emails: z.string().default(""),
  google_sheets_id: z.string().optional().default(""),
  google_drive_folder_id: z.string().optional().default(""),
  root_drive_folder_id: z.string().optional().default(""),
  team_emails: z.string().optional().default(""),
  reminder_days_before: z.number().int().nonnegative().optional().default(3),
  reminder_daily_hour: z.number().int().min(0).max(23).optional().default(9),
  reminder_d3_enabled: z.boolean().optional().default(true),
  reminder_d1_enabled: z.boolean().optional().default(true),
  reminder_d0_enabled: z.boolean().optional().default(true),
  reminder_overdue_enabled: z.boolean().optional().default(true),
  reminder_overdue_every_days: z.number().int().min(1).optional().default(1),
  timezone: z.string().optional().default("America/Sao_Paulo"),
  last_reminder_run_at: z.string().optional(),
});

export type PaymentInput = z.infer<typeof PaymentSchema>;
export type AuditLogInput = z.infer<typeof AuditLogSchema>;
export type ReminderLedgerInput = z.infer<typeof ReminderLedgerSchema>;
export type ConfigInput = z.infer<typeof ConfigSchema>;

export const parseCompetence = (value?: string) => {
  if (!value) return undefined;
  const parsed = competenceSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
};

export const formatCurrency = (
  value?: number,
  locale = "pt-BR",
  currency = "BRL",
) => {
  if (value === undefined || value === null) return "";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
};

export const computeAutoStatus = (
  dueDate?: string,
  status?: z.infer<typeof PaymentStatusEnum> | string,
) => {
  if (!dueDate || !status) return status ?? "RASCUNHO";
  if (status === "PAGO") return status;
  const overdue = isBefore(parseISO(dueDate), startOfDay(new Date()));
  return overdue ? "ATRASADO" : status;
};

const transitionMap: Record<
  z.infer<typeof PaymentStatusEnum>,
  z.infer<typeof PaymentStatusEnum>[]
> = {
  RASCUNHO: ["EM_ACOMPANHAMENTO", "ATRASADO"],
  EM_ACOMPANHAMENTO: ["AGUARDANDO_PAGAMENTO", "RASCUNHO", "ATRASADO"],
  AGUARDANDO_PAGAMENTO: ["PAGO", "EM_ACOMPANHAMENTO", "ATRASADO"],
  PAGO: [],
  ATRASADO: ["PAGO", "AGUARDANDO_PAGAMENTO"],
};

export const canTransitionStatus = (
  from: z.infer<typeof PaymentStatusEnum>,
  to: z.infer<typeof PaymentStatusEnum>,
) => transitionMap[from].includes(to);

export const assertTransitionStatus = (
  from: z.infer<typeof PaymentStatusEnum>,
  to: z.infer<typeof PaymentStatusEnum>,
) => {
  if (!canTransitionStatus(from, to)) {
    throw new Error(`Transicao invalida: ${from} -> ${to}`);
  }
};



