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
    LOW_BALANCE_THRESHOLD: z.string().optional(),
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

export const env = {
  ...(parsed.success
    ? parsed.data
    : (process.env as unknown as z.infer<typeof EnvSchema>)),
  GOOGLE_PRIVATE_KEY: (parsed.success
    ? parsed.data.GOOGLE_PRIVATE_KEY
    : process.env.GOOGLE_PRIVATE_KEY ?? ""
  ).replace(/\\n/g, "\n"),
  LOW_BALANCE_THRESHOLD:
    (parsed.success ? parsed.data.LOW_BALANCE_THRESHOLD : process.env.LOW_BALANCE_THRESHOLD) ??
    "0",
  ENABLE_SEED:
    (parsed.success ? parsed.data.ENABLE_SEED : process.env.ENABLE_SEED) ?? "false",
};
