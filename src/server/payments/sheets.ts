import { google } from "googleapis";
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
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
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
    throw error;
  }
};

export const updatePaymentRow = async (
  sheetId: string,
  range: string,
  payment: Record<string, unknown>,
) => {
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [paymentToRow(payment)],
      },
    });

    return response.data.updatedRange ?? range;
  } catch (error) {
    logger.error("[sheets] updatePaymentRow error", { error });
    throw error;
  }
};

export const getPayments = async (sheetId: string, range: string) => {
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    return response.data.values ?? [];
  } catch (error) {
    logger.error("[sheets] getPayments error", { error });
    throw error;
  }
};

export const appendAuditLog = async (
  sheetId: string,
  range: string,
  audit: Record<string, unknown>,
) => {
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
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
    throw error;
  }
};

export const appendReminderLedger = async (
  sheetId: string,
  range: string,
  ledger: Record<string, unknown>,
) => {
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
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
    throw error;
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
    const values = await getPayments(sheetId, range);
    const sheets = getSheetsClient();

    if (values.length < 2) {
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
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
      spreadsheetId: sheetId,
      range: rowRange,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [configToRow(config)],
      },
    });

    return response.data.updatedRange ?? rowRange;
  } catch (error) {
    logger.error("[sheets] upsertConfig error", { error });
    throw error;
  }
};

const getRowValues = async (
  sheetId: string,
  sheetName: string,
  rowNumber: number,
  columnCount: number,
) => {
  const range = getRowRange(sheetName, rowNumber, columnCount);
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
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
