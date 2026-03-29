import "server-only";
import { z } from "zod";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const EnvSchema = z
  .object({
    GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID nao definido."),
    GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET nao definido."),
    NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET nao definido."),
    ALLOWED_EMAILS: z.string().optional(),
    ALLOWED_DOMAIN: z.string().optional(),
    ADMIN_EMAILS: z.string().min(1, "ADMIN_EMAILS nao definido."),
    SHEETS_SPREADSHEET_ID: z.string().min(1, "SHEETS_SPREADSHEET_ID nao definido."),
    GOOGLE_SERVICE_ACCOUNT_EMAIL: z
      .string()
      .min(1, "GOOGLE_SERVICE_ACCOUNT_EMAIL nao definido."),
    GOOGLE_PRIVATE_KEY: z.string().min(1, "GOOGLE_PRIVATE_KEY nao definido."),
    DRIVE_FOLDER_ID: z.string().min(1, "DRIVE_FOLDER_ID nao definido."),
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
  .superRefine((data, ctx) => {
    if (!data.ALLOWED_EMAILS && !data.ALLOWED_DOMAIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Defina ALLOWED_EMAILS ou ALLOWED_DOMAIN.",
      });
    }
  });

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


