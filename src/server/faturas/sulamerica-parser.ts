import "server-only";
import * as XLSX from "xlsx";

export type SulamericaParsedRow = {
  identificacao: string;
  nome: string;
  parentesco: string;
  premio: number;
};

export type SulamericaParseError = {
  code: "SHEET_NOT_FOUND" | "HEADER_NOT_FOUND" | "PARSE_ERROR";
  message: string;
};

export type SulamericaParseResult =
  | {
      ok: true;
      rows: SulamericaParsedRow[];
      total_geral_premio?: number;
    }
  | { ok: false; error: SulamericaParseError };

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const parseBrazilianMoney = (value: string | number) => {
  if (typeof value === "number") return value;
  const cleaned = value.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) return 0;

  let normalized = cleaned;
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasDot) {
    normalized = cleaned.replace(/,/g, "");
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const findHeaderRowIndex = (rows: (string | number)[][]) => {
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    for (const cell of row) {
      if (cell === null || cell === undefined) continue;
      const normalized = normalizeText(String(cell));
      if (normalized.includes("premio")) {
        return i;
      }
    }
  }
  return -1;
};

const findColumnIndex = (headers: (string | number)[], candidates: string[]) => {
  const normalizedHeaders = headers.map((header) =>
    normalizeText(String(header ?? "")),
  );
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeText(candidate);
    const index = normalizedHeaders.findIndex((header) =>
      header.includes(normalizedCandidate),
    );
    if (index !== -1) return index;
  }
  return -1;
};

const isEmptyRow = (row: (string | number)[]) =>
  row.every((cell) => {
    if (cell === null || cell === undefined) return true;
    if (typeof cell === "number") return false;
    return String(cell).trim() === "";
  });

const findLastNonEmptyRowIndex = (rows: (string | number)[][]) => {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i] ?? [];
    if (!isEmptyRow(row)) return i;
  }
  return -1;
};

const findLegendaRowIndex = (rows: (string | number)[][], startIndex: number) => {
  for (let i = startIndex; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    for (const cell of row) {
      if (cell === null || cell === undefined) continue;
      const normalized = normalizeText(String(cell));
      if (normalized.includes("legenda")) {
        return i;
      }
    }
  }
  return -1;
};

export const parseSulamericaXlsx = (
  bytes: Buffer | ArrayBuffer | Uint8Array,
): SulamericaParseResult => {
  try {
    const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames.find(
      (name) => normalizeText(name) === normalizeText("SeguradosAtivos"),
    );

    if (!sheetName) {
      return {
        ok: false,
        error: {
          code: "SHEET_NOT_FOUND",
          message: "Aba SeguradosAtivos não encontrada no arquivo.",
        },
      };
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
    }) as (string | number)[][];

    const headerRowIndex = findHeaderRowIndex(rows);
    if (headerRowIndex === -1) {
      return {
        ok: false,
        error: {
          code: "HEADER_NOT_FOUND",
          message: "Não foi possível localizar o cabeçalho da planilha.",
        },
      };
    }

    const headerRow = rows[headerRowIndex] ?? [];
    const identificacaoIndex = findColumnIndex(headerRow, [
      "cod de identificacao",
      "codigo de identificacao",
      "cod identificacao",
    ]);
    const nomeIndex = findColumnIndex(headerRow, ["nome segurado"]);
    const parentescoIndex = findColumnIndex(headerRow, ["parentesco"]);
    const premioIndex = findColumnIndex(headerRow, ["premio"]);

    if (
      identificacaoIndex === -1 ||
      nomeIndex === -1 ||
      parentescoIndex === -1 ||
      premioIndex === -1
    ) {
      return {
        ok: false,
        error: {
          code: "HEADER_NOT_FOUND",
          message: "Cabeçalho esperado não encontrado na planilha.",
        },
      };
    }

    const legendaIndex = findLegendaRowIndex(rows, headerRowIndex + 1);
    const lastNonEmptyIndex = findLastNonEmptyRowIndex(rows);
    const endIndex =
      legendaIndex !== -1 ? legendaIndex : lastNonEmptyIndex + 1;

    const dataRows = rows.slice(headerRowIndex + 1, endIndex);
    const result: SulamericaParsedRow[] = [];
    let totalGeralPremio: number | undefined;

    for (const row of dataRows) {
      if (isEmptyRow(row)) continue;
      const nome = String(row[nomeIndex] ?? "").trim();
      if (!nome) continue;
      const normalizedNome = normalizeText(nome);
      if (normalizedNome.includes("total")) {
        if (normalizedNome.includes("total geral")) {
          totalGeralPremio = parseBrazilianMoney(String(row[premioIndex] ?? ""));
        }
        continue;
      }

      const identificacao = String(row[identificacaoIndex] ?? "").trim();
      const parentesco = String(row[parentescoIndex] ?? "").trim();
      const premioRaw = row[premioIndex] ?? "";
      const premio = parseBrazilianMoney(String(premioRaw));

      result.push({
        identificacao,
        nome,
        parentesco,
        premio,
      });
    }

    return {
      ok: true,
      rows: result,
      total_geral_premio: totalGeralPremio,
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "PARSE_ERROR",
        message: "Falha ao interpretar o arquivo XLSX.",
      },
    };
  }
};
