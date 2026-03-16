import { google } from "googleapis";
import { env } from "@/lib/env";
import { ApiError } from "@/server/payments/errors";
import { getGoogleAuth } from "@/server/payments/google";
import {
  paymentToRow,
  auditToRow,
  reminderToRow,
  configToRow,
  rowToConfig,
} from "@/server/payments/sheets-schema";
import { logger } from "@/server/payments/logger";
import { getRowRange } from "@/server/payments/sheets-utils";

export const getSheetsClient = () =>
  google.sheets({ version: "v4", auth: getGoogleAuth() });

const getErrorStatus = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Erro desconhecido ao acessar o Google Sheets.";

const resolvePaymentsSheetId = (sheetId?: string) => {
  const resolved = sheetId?.trim() || env.PAYMENTS_SHEETS_ID?.trim() || "";
  if (!resolved) {
    throw new ApiError(
      "PAYMENTS_SHEETS_ID nao definido. Configure a planilha do modulo de pagamentos.",
      500,
      "PAYMENTS_SHEETS_ID_MISSING",
    );
  }
  return resolved;
};

const toApiError = (
  error: unknown,
  action: "ler" | "gravar" | "atualizar",
  range: string,
) => {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error);
  const sheetName = range.split("!")[0] ?? "payments";

  if (status === 404 || message.includes("Requested entity was not found")) {
    return new ApiError(
      "Planilha de pagamentos nao encontrada. Verifique PAYMENTS_SHEETS_ID e se a service account tem acesso.",
      500,
      "PAYMENTS_SHEETS_NOT_FOUND",
    );
  }

  if (status === 403 || message.includes("does not have permission")) {
    return new ApiError(
      `A service account nao tem permissao para acessar a planilha de pagamentos. Compartilhe a planilha com ${env.GOOGLE_SERVICE_ACCOUNT_EMAIL}.`,
      500,
      "PAYMENTS_SHEETS_FORBIDDEN",
    );
  }

  if (message.includes("Unable to parse range")) {
    return new ApiError(
      `A aba "${sheetName}" nao foi encontrada na planilha de pagamentos.`,
      500,
      "PAYMENTS_RANGE_NOT_FOUND",
    );
  }

  return new ApiError(
    `Erro ao ${action} dados da planilha de pagamentos: ${message}`,
    500,
    "PAYMENTS_SHEETS_ERROR",
  );
};

const parseRowNumber = (updatedRange?: string) => {
  if (!updatedRange) return undefined;
  const match = updatedRange.match(/![A-Z]+(\d+):/i);
  return match ? Number(match[1]) : undefined;
};

const paymentRowCache = new Map<string, number>();

export const appendPaymentRow = async (
  sheetId: string,
  range: string,
  payment: Record<string, unknown>,
) => {
  try {
    const resolvedSheetId = resolvePaymentsSheetId(sheetId);
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: resolvedSheetId,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [paymentToRow(payment)],
      },
    });

    const updatedRange = response.data.updates?.updatedRange ?? "";
    const rowNumber = parseRowNumber(updatedRange);
    if (payment.id && rowNumber) {
      paymentRowCache.set(String(payment.id), rowNumber);
    }
    return { updatedRange, rowNumber };
  } catch (error) {
    logger.error("[sheets] appendPaymentRow error", { error });
    throw toApiError(error, "gravar", range);
  }
};

export const updatePaymentRow = async (
  sheetId: string,
  range: string,
  payment: Record<string, unknown>,
) => {
  try {
    const resolvedSheetId = resolvePaymentsSheetId(sheetId);
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: resolvedSheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [paymentToRow(payment)],
      },
    });

    return response.data.updatedRange ?? range;
  } catch (error) {
    logger.error("[sheets] updatePaymentRow error", { error });
    throw toApiError(error, "atualizar", range);
  }
};

export const getPayments = async (sheetId: string, range: string) => {
  try {
    const resolvedSheetId = resolvePaymentsSheetId(sheetId);
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: resolvedSheetId,
      range,
    });

    return response.data.values ?? [];
  } catch (error) {
    logger.error("[sheets] getPayments error", { error });
    throw toApiError(error, "ler", range);
  }
};

export const appendAuditLog = async (
  sheetId: string,
  range: string,
  audit: Record<string, unknown>,
) => {
  try {
    const resolvedSheetId = resolvePaymentsSheetId(sheetId);
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: resolvedSheetId,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [auditToRow(audit)],
      },
    });

    const updatedRange = response.data.updates?.updatedRange ?? "";
    const rowNumber = parseRowNumber(updatedRange);
    return { updatedRange, rowNumber };
  } catch (error) {
    logger.error("[sheets] appendAuditLog error", { error });
    throw toApiError(error, "gravar", range);
  }
};

export const appendReminderLedger = async (
  sheetId: string,
  range: string,
  ledger: Record<string, unknown>,
) => {
  try {
    const resolvedSheetId = resolvePaymentsSheetId(sheetId);
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: resolvedSheetId,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [reminderToRow(ledger)],
      },
    });

    const updatedRange = response.data.updates?.updatedRange ?? "";
    const rowNumber = parseRowNumber(updatedRange);
    return { updatedRange, rowNumber };
  } catch (error) {
    logger.error("[sheets] appendReminderLedger error", { error });
    throw toApiError(error, "gravar", range);
  }
};

export const getConfig = async (sheetId: string, range: string) => {
  try {
    const values = await getPayments(sheetId, range);
    if (values.length < 2) return null;
    const row = values[1] ?? [];
    return rowToConfig(row as string[]);
  } catch (error) {
    logger.error("[sheets] getConfig error", { error });
    throw error;
  }
};

export const upsertConfig = async (
  sheetId: string,
  range: string,
  rowRange: string,
  config: Record<string, unknown>,
) => {
  try {
    const resolvedSheetId = resolvePaymentsSheetId(sheetId);
    const values = await getPayments(sheetId, range);
    const sheets = getSheetsClient();

    if (values.length < 2) {
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: resolvedSheetId,
        range,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [configToRow(config)],
        },
      });
      return response.data.updates?.updatedRange ?? rowRange;
    }

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: resolvedSheetId,
      range: rowRange,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [configToRow(config)],
      },
    });

    return response.data.updatedRange ?? rowRange;
  } catch (error) {
    logger.error("[sheets] upsertConfig error", { error });
    throw toApiError(error, "atualizar", rowRange);
  }
};

const getRowValues = async (
  sheetId: string,
  sheetName: string,
  rowNumber: number,
  columnCount: number,
) => {
  const range = getRowRange(sheetName, rowNumber, columnCount);
  const resolvedSheetId = resolvePaymentsSheetId(sheetId);
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: resolvedSheetId,
    range,
  });
  return response.data.values?.[0] ?? null;
};

export const findPaymentRowById = async (
  sheetId: string,
  range: string,
  paymentId: string,
) => {
  try {
    if (!paymentId) return undefined;

    const cachedRow = paymentRowCache.get(paymentId);
    if (cachedRow) {
      const cachedRowValues = await getRowValues(
        sheetId,
        range.split("!")[0] ?? "payments",
        cachedRow,
        paymentToRow({}).length,
      );
      if (cachedRowValues) {
        return { rowNumber: cachedRow, row: cachedRowValues };
      }
      paymentRowCache.delete(paymentId);
    }

    const values = await getPayments(sheetId, range);
    if (values.length === 0) return undefined;

    const headerOffset = 1;
    for (let i = headerOffset; i < values.length; i += 1) {
      const row = values[i] ?? [];
      if (row[0] === paymentId) {
        const rowNumber = i + 1;
        paymentRowCache.set(paymentId, rowNumber);
        return { rowNumber, row };
      }
    }

    return undefined;
  } catch (error) {
    logger.error("[sheets] findPaymentRowById error", { error });
    throw error;
  }
};
