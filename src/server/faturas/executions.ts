import "server-only";
import { z } from "zod";
import { SHEETS } from "@/config/payments-constants";
import {
  FATURAS_EXECUCOES_COLUMNS,
  faturasExecucaoToRow,
  rowToFaturasExecucao,
} from "@/server/payments/sheets-schema";
import { getSheetsClient, getPayments } from "@/server/payments/sheets";
import { getSheetRange } from "@/server/payments/sheets-utils";
import { env } from "@/lib/env";

export const FaturasExecucaoSchema = z.object({
  competencia: z.string().min(1),
  processed_at: z.string().min(1),
  actor_email: z.string().optional().default(""),
  actor_name: z.string().optional().default(""),
  status: z.string().optional().default(""),
  duration_ms: z.number().nonnegative().optional().default(0),
  contratos_ok: z.number().nonnegative().optional().default(0),
  contratos_erro: z.number().nonnegative().optional().default(0),
  total_vidas: z.number().nonnegative().optional().default(0),
  total_custo: z.number().nonnegative().optional().default(0),
});

export type FaturasExecucaoInput = z.infer<typeof FaturasExecucaoSchema>;

const getSheetId = () => env.PAYMENTS_SHEETS_ID ?? "";

const getRange = () =>
  getSheetRange(SHEETS.FATURAS_EXECUCOES, FATURAS_EXECUCOES_COLUMNS.length);

export const appendFaturasExecucao = async (input: FaturasExecucaoInput) => {
  const sheetId = getSheetId();
  if (!sheetId) {
    throw new Error("PAYMENTS_SHEETS_ID nao definido para auditoria.");
  }

  const record = FaturasExecucaoSchema.parse(input);
  const range = getRange();
  const sheets = getSheetsClient();

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [faturasExecucaoToRow(record)],
    },
  });
};

export const listFaturasExecucoesByCompetencia = async (
  competencia: string,
) => {
  const sheetId = getSheetId();
  if (!sheetId) {
    throw new Error("PAYMENTS_SHEETS_ID nao definido para consulta.");
  }

  const range = getRange();
  const values = await getPayments(sheetId, range);
  if (values.length <= 1) return [];

  const rows = values
    .slice(1)
    .map((row) => rowToFaturasExecucao(row as string[]))
    .filter((row) => row.competencia === competencia)
    .sort((a, b) => b.processed_at.localeCompare(a.processed_at));

  return rows;
};
