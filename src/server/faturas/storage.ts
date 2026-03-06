import "server-only";
import { z } from "zod";
import { SHEETS } from "@/config/payments-constants";
import {
  FATURAS_CONTRATOS_COLUMNS,
  faturasContratoToRow,
  rowToFaturasContrato,
} from "@/server/payments/sheets-schema";
import { getSheetsClient, getPayments } from "@/server/payments/sheets";
import { getRowRange, getSheetRange } from "@/server/payments/sheets-utils";
import { logger } from "@/server/payments/logger";
import { env } from "@/lib/env";

export const FaturasContratoSchema = z.object({
  competencia: z.string().min(1),
  operadora: z.string().min(1),
  contrato_codigo: z.string().min(1),
  empresa_nome: z.string().optional().default(""),
  vidas_ativas: z.number().nonnegative().optional().default(0),
  custo_total: z.number().nonnegative().optional().default(0),
  custo_por_contrato: z.number().nonnegative().optional().default(0),
  file_id: z.string().optional().default(""),
  modified_time: z.string().optional().default(""),
  processed_at: z.string().optional().default(""),
  status: z.string().optional().default(""),
  error_message: z.string().optional().default(""),
});

export type FaturasContratoInput = z.infer<typeof FaturasContratoSchema>;

const getSheetId = () => env.PAYMENTS_SHEETS_ID ?? "";

const getRange = () =>
  getSheetRange(SHEETS.FATURAS_CONTRATOS, FATURAS_CONTRATOS_COLUMNS.length);

const getRowRangeByNumber = (rowNumber: number) =>
  getRowRange(
    SHEETS.FATURAS_CONTRATOS,
    rowNumber,
    FATURAS_CONTRATOS_COLUMNS.length,
  );

export const upsertFaturasContrato = async (input: FaturasContratoInput) => {
  const sheetId = getSheetId();
  if (!sheetId) {
    throw new Error("PAYMENTS_SHEETS_ID nao definido para persistencia.");
  }

  const record = FaturasContratoSchema.parse(input);
  const range = getRange();
  const values = await getPayments(sheetId, range);
  const sheets = getSheetsClient();

  const headerOffset = 1;
  let existingRowNumber: number | undefined;

  for (let i = headerOffset; i < values.length; i += 1) {
    const row = values[i] ?? [];
    if (
      row[0] === record.competencia &&
      row[1] === record.operadora &&
      row[2] === record.contrato_codigo
    ) {
      existingRowNumber = i + 1;
      break;
    }
  }

  if (existingRowNumber) {
    const rowRange = getRowRangeByNumber(existingRowNumber);
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: rowRange,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [faturasContratoToRow(record)],
      },
    });
    return { rowNumber: existingRowNumber };
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [faturasContratoToRow(record)],
    },
  });

  return { rowNumber: values.length + 1 };
};

export const upsertFaturasContratos = async (
  records: FaturasContratoInput[],
) => {
  const results: { contrato_codigo: string; ok: boolean; error?: string }[] = [];

  for (const record of records) {
    try {
      await upsertFaturasContrato(record);
      results.push({ contrato_codigo: record.contrato_codigo, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar.";
      logger.error("[faturas] upsert contrato falhou", {
        contrato_codigo: record.contrato_codigo,
        error: message,
      });
      results.push({
        contrato_codigo: record.contrato_codigo,
        ok: false,
        error: message,
      });
    }
  }

  return results;
};

export const listFaturasContratosByCompetencia = async (
  competencia: string,
) => {
  const sheetId = getSheetId();
  if (!sheetId) {
    throw new Error("PAYMENTS_SHEETS_ID nao definido para consulta.");
  }

  const range = getRange();
  const values = await getPayments(sheetId, range);
  if (values.length <= 1) return [];

  const rows = values.slice(1).map((row) => rowToFaturasContrato(row as string[]));
  return rows.filter((row) => row.competencia === competencia);
};
