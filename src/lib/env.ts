import "server-only";
import { z } from "zod";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const EnvSchema = z
  .object({
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    NEXTAUTH_SECRET: z.string().optional(),
    DEV_LOGIN_EMAIL: z.string().optional(),
    SUPABASE_URL: z.string().url("SUPABASE_URL invalido.").optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    ALLOWED_EMAILS: z.string().optional(),
    ALLOWED_DOMAIN: z.string().optional(),
    ADMIN_EMAILS: z.string().optional(),
    SHEETS_SPREADSHEET_ID: z.string().optional(),
    GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
    GOOGLE_PRIVATE_KEY: z.string().optional(),
    DRIVE_FOLDER_ID: z.string().optional(),
    PAYMENTS_SHEETS_ID: z.string().optional(),
    PAYMENTS_DRIVE_FOLDER_ID: z.string().optional(),
    INDICATORS_SHEETS_ID: z.string().optional(),
    INDICATORS_HEALTH_SHEETS_ID: z.string().optional(),
    INDICATORS_DENTAL_SHEETS_ID: z.string().optional(),
    INDICATORS_TRANSPORT_SHEETS_ID: z.string().optional(),
    INDICATORS_MEAL_SHEETS_ID: z.string().optional(),
    INDICATORS_HEALTH_SHEET_NAME: z.string().optional(),
    INDICATORS_HEALTH_COPART_SHEET_NAME: z.string().optional(),
    INDICATORS_HEALTH_DISCOUNT_SHEET_NAME: z.string().optional(),
    INDICATORS_HEALTH_COPART_DISCOUNT_SHEET_NAME: z.string().optional(),
    INDICATORS_DENTAL_SHEET_NAME: z.string().optional(),
    INDICATORS_TRANSPORT_SHEET_NAME: z.string().optional(),
    INDICATORS_MEAL_SHEET_NAME: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().optional(),
    LOW_BALANCE_THRESHOLD: z.string().optional(),
    FATURAS_SULAMERICA_BASE_FOLDER_ID: z.string().optional(),
    COMPETENCIA_FOLDER_PATTERN: z.string().optional(),
    ENABLE_SEED: z.string().optional(),
  })
  .superRefine(() => {});

const isBuildPhase = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  if (!isBuildPhase) {
    const message = parsed.error.issues.map((issue) => issue.message).join(" ");
    throw new Error(`Falha na validação de env: ${message}`);
  }
}

const validatedData = parsed.success ? parsed.data : undefined;

if (!validatedData && !isBuildPhase) {
  throw new Error("Env validation failed and not in build phase.");
}

const get = <K extends keyof z.infer<typeof EnvSchema>>(key: K) =>
  validatedData?.[key] ?? (process.env[key] as string | undefined);

export const env = {
  ...(validatedData ?? (process.env as unknown as z.infer<typeof EnvSchema>)),
  GOOGLE_PRIVATE_KEY: (get("GOOGLE_PRIVATE_KEY") ?? "").replace(/\\n/g, "\n"),
  GOOGLE_CLIENT_ID: get("GOOGLE_CLIENT_ID") ?? "",
  GOOGLE_CLIENT_SECRET: get("GOOGLE_CLIENT_SECRET") ?? "",
  NEXTAUTH_SECRET: get("NEXTAUTH_SECRET") ?? "",
  DEV_LOGIN_EMAIL: get("DEV_LOGIN_EMAIL") ?? "",
  ADMIN_EMAILS: get("ADMIN_EMAILS") ?? "",
  SHEETS_SPREADSHEET_ID: get("SHEETS_SPREADSHEET_ID") ?? "",
  GOOGLE_SERVICE_ACCOUNT_EMAIL: get("GOOGLE_SERVICE_ACCOUNT_EMAIL") ?? "",
  DRIVE_FOLDER_ID: get("DRIVE_FOLDER_ID") ?? "",
  ALLOWED_EMAILS: get("ALLOWED_EMAILS") ?? "",
  ALLOWED_DOMAIN: get("ALLOWED_DOMAIN") ?? "",
  LOW_BALANCE_THRESHOLD: get("LOW_BALANCE_THRESHOLD") ?? "0",
  INDICATORS_SHEETS_ID:
    get("INDICATORS_SHEETS_ID") ?? get("PAYMENTS_SHEETS_ID") ?? get("SHEETS_SPREADSHEET_ID") ?? "",
  INDICATORS_HEALTH_SHEET_NAME:
    get("INDICATORS_HEALTH_SHEET_NAME") ?? "BASE DEMONSTRATIVO",
  INDICATORS_HEALTH_COPART_SHEET_NAME:
    get("INDICATORS_HEALTH_COPART_SHEET_NAME") ?? "COPART",
  INDICATORS_HEALTH_DISCOUNT_SHEET_NAME:
    get("INDICATORS_HEALTH_DISCOUNT_SHEET_NAME") ?? "DESCONTOS MENSALIDADE",
  INDICATORS_HEALTH_COPART_DISCOUNT_SHEET_NAME:
    get("INDICATORS_HEALTH_COPART_DISCOUNT_SHEET_NAME") ?? "DESCONTOS COPART",
  INDICATORS_HEALTH_SHEETS_ID:
    get("INDICATORS_HEALTH_SHEETS_ID") ?? get("INDICATORS_SHEETS_ID") ?? "",
  INDICATORS_DENTAL_SHEET_NAME:
    get("INDICATORS_DENTAL_SHEET_NAME") ?? "indicadores_odontologico",
  INDICATORS_DENTAL_SHEETS_ID:
    get("INDICATORS_DENTAL_SHEETS_ID") ?? get("INDICATORS_SHEETS_ID") ?? "",
  INDICATORS_TRANSPORT_SHEET_NAME:
    get("INDICATORS_TRANSPORT_SHEET_NAME") ?? "indicadores_vale_transporte",
  INDICATORS_TRANSPORT_SHEETS_ID:
    get("INDICATORS_TRANSPORT_SHEETS_ID") ?? get("INDICATORS_SHEETS_ID") ?? "",
  INDICATORS_MEAL_SHEET_NAME:
    get("INDICATORS_MEAL_SHEET_NAME") ?? "indicadores_vale_refeicao",
  INDICATORS_MEAL_SHEETS_ID:
    get("INDICATORS_MEAL_SHEETS_ID") ?? get("INDICATORS_SHEETS_ID") ?? "",
  FATURAS_SULAMERICA_BASE_FOLDER_ID:
    get("FATURAS_SULAMERICA_BASE_FOLDER_ID") ?? "",
  COMPETENCIA_FOLDER_PATTERN:
    get("COMPETENCIA_FOLDER_PATTERN") ?? "YYYY-MM",
  ENABLE_SEED: get("ENABLE_SEED") ?? "false",
};


