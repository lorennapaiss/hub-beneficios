import "server-only";
import { google, sheets_v4 } from "googleapis";
import { env } from "@/lib/env";
import { getCache, invalidateCache, setCache } from "@/server/cache";

type QueryFilters = Record<string, string | number | boolean | null | undefined>;

export type QueryOptions = {
  filters?: QueryFilters;
  search?: string;
  limit?: number;
  offset?: number;
};

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const sanitizeError = (error: unknown, message: string) => {
  if (error instanceof Error) {
    return new Error(`${message} ${error.message}`);
  }
  return new Error(message);
};

const normalizeKey = (value: string) => value.trim();

const normalizeValue = (value: string | undefined | null) =>
  (value ?? "").toString().trim();

const toColumnLetter = (index: number) => {
  let result = "";
  let current = index + 1;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }
  return result;
};

const parseHeaders = (values: string[][]) => {
  const headers = values[0]?.map((header) => normalizeKey(header)) ?? [];
  if (headers.length === 0) {
    throw new Error(
      "A planilha está sem cabeçalho. Adicione a primeira linha com os nomes das colunas."
    );
  }
  return headers;
};

const mapRow = (headers: string[], row: string[]) =>
  headers.reduce<Record<string, string>>((acc, header, index) => {
    acc[header] = row[index] ?? "";
    return acc;
  }, {});

const stringifyValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
};

export const getClient = async (): Promise<sheets_v4.Sheets> => {
  try {
    const auth = new google.auth.JWT({
      email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: env.GOOGLE_PRIVATE_KEY,
      scopes: SCOPES,
    });

    await auth.authorize();
    return google.sheets({ version: "v4", auth });
  } catch (error) {
    throw sanitizeError(error, "Erro ao autenticar no Google Sheets.");
  }
};

export const getRows = async (sheetName: string) => {
  try {
    const sheets = await getClient();
    const spreadsheetId = env.SHEETS_SPREADSHEET_ID;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    const values = (response.data.values ?? []) as string[][];
    if (values.length === 0) return [];

    const headers = parseHeaders(values);
    return values.slice(1).map((row) => mapRow(headers, row));
  } catch (error) {
    throw sanitizeError(error, `Erro ao ler dados da aba "${sheetName}".`);
  }
};

export const getRowsCached = async (sheetName: string, ttlMs = 5000) => {
  const cacheKey = `sheet:${sheetName}`;
  const cached = getCache<Record<string, string>[]>(cacheKey);
  if (cached) return cached;
  const rows = await getRows(sheetName);
  setCache(cacheKey, rows, ttlMs);
  return rows;
};

export const appendRow = async (
  sheetName: string,
  rowObject: Record<string, unknown>
) => {
  try {
    const sheets = await getClient();
    const spreadsheetId = env.SHEETS_SPREADSHEET_ID;
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`,
    });

    const headers = parseHeaders((headerResponse.data.values ?? []) as string[][]);
    const rowValues = headers.map((header) => stringifyValue(rowObject[header]));

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [rowValues],
      },
    });

    invalidateCache(`sheet:${sheetName}`);
    return { ok: true };
  } catch (error) {
    throw sanitizeError(error, `Erro ao inserir dados na aba "${sheetName}".`);
  }
};

export const findById = async (
  sheetName: string,
  idField: string,
  idValue: string
) => {
  const rows = await getRows(sheetName);
  const target = normalizeValue(idValue);
  return (
    rows.find((row) => normalizeValue(row[idField]) === target) ?? null
  );
};

export const updateRowById = async (
  sheetName: string,
  idField: string,
  idValue: string,
  patchObject: Record<string, unknown>
) => {
  try {
    const sheets = await getClient();
    const spreadsheetId = env.SHEETS_SPREADSHEET_ID;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    const values = (response.data.values ?? []) as string[][];
    if (values.length === 0) {
      throw new Error("A planilha está vazia.");
    }

    const headers = parseHeaders(values);
    const idIndex = headers.indexOf(idField);
    if (idIndex === -1) {
      throw new Error(`Coluna "${idField}" não encontrada na aba "${sheetName}".`);
    }
    const dataRows = values.slice(1);
    const target = normalizeValue(idValue);
    const rowIndex = dataRows.findIndex(
      (row) => normalizeValue(row[idIndex]) === target
    );

    if (rowIndex === -1) {
      return { ok: false, message: "Registro não encontrado." };
    }

    const currentRow = mapRow(headers, dataRows[rowIndex] ?? []);
    const updatedRow = {
      ...currentRow,
      ...Object.fromEntries(
        Object.entries(patchObject).map(([key, value]) => [key, stringifyValue(value)])
      ),
    };

    const rowValues = headers.map((header) => stringifyValue(updatedRow[header]));
    const range = `${sheetName}!A${rowIndex + 2}:${toColumnLetter(
      headers.length - 1
    )}${rowIndex + 2}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowValues],
      },
    });

    invalidateCache(`sheet:${sheetName}`);
    return { ok: true };
  } catch (error) {
    throw sanitizeError(error, `Erro ao atualizar dados na aba "${sheetName}".`);
  }
};

export const queryRows = async (sheetName: string, options: QueryOptions = {}) => {
  const { filters, search, limit, offset } = options;
  const rows = await getRows(sheetName);

  let result = rows;

  if (filters && Object.keys(filters).length > 0) {
    result = result.filter((row) =>
      Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null) return true;
        return row[key] === String(value);
      })
    );
  }

  if (search && search.trim()) {
    const term = search.toLowerCase();
    result = result.filter((row) =>
      Object.values(row).some((value) => value.toLowerCase().includes(term))
    );
  }

  const start = Math.max(offset ?? 0, 0);
  const end = limit ? start + Math.max(limit, 0) : undefined;
  return result.slice(start, end);
};
