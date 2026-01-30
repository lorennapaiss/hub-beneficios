export enum PaymentStatus {
  RASCUNHO = "RASCUNHO",
  EM_ACOMPANHAMENTO = "EM_ACOMPANHAMENTO",
  AGUARDANDO_PAGAMENTO = "AGUARDANDO_PAGAMENTO",
  PAGO = "PAGO",
  ATRASADO = "ATRASADO",
}

export enum BenefitType {
  PLANO_SAUDE = "PLANO_SAUDE",
  VALE_ALIMENTACAO = "VALE_ALIMENTACAO",
  VALE_TRANSPORTE = "VALE_TRANSPORTE",
  OUTRO = "OUTRO",
}

export type Currency = "BRL" | "USD" | "EUR";

export interface Payment {
  id: string;
  employeeId: string;
  employeeName: string;
  benefitType: BenefitType;
  providerName: string;
  description: string;
  amount: number;
  currency: Currency;
  dueDate: string;
  status: PaymentStatus;
  boletoFileId?: string;
  boletoFileUrl?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  paymentReference?: string;
  notes?: string;
}

export enum AuditEntityType {
  PAYMENT = "PAYMENT",
  CONFIG = "CONFIG",
  REMINDER_RUN = "REMINDER_RUN",
}

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  MARK_PAID = "MARK_PAID",
  UPLOAD = "UPLOAD",
  RUN = "RUN",
}

export interface AuditLog {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  before?: string;
  after?: string;
  actorEmail: string;
  actorRole: "ADMIN" | "USER";
  createdAt: string;
  metadata?: string;
}

export enum ReminderType {
  DUE_SOON = "DUE_SOON",
  OVERDUE = "OVERDUE",
  DAILY = "DAILY",
}

export enum ReminderResult {
  SENT = "SENT",
  SKIPPED = "SKIPPED",
  FAILED = "FAILED",
}

export interface ReminderLedger {
  id: string;
  paymentId: string;
  dueDate: string;
  statusAtRun: PaymentStatus;
  reminderType: ReminderType;
  sentTo: string;
  sentAt: string;
  runId: string;
  result: ReminderResult;
  error?: string;
}

export interface AppConfig {
  id: "global";
  allowedDomains: string;
  allowedEmails: string;
  adminEmails: string;
  googleSheetsId: string;
  googleDriveFolderId: string;
  reminderDaysBefore: number;
  reminderDailyHour: number;
  timezone: string;
  lastReminderRunAt?: string;
}
