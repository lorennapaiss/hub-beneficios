import "server-only";
import * as XLSX from "xlsx";

export type SinproParsedRow = {
  identificacao: string;
  nome: string;
  parentesco: string;
  premio: number;
  contrato_codigo: string;
  empresa_nome: string;
};

export type SinproParseError = {
  code: "SHEET_NOT_FOUND" | "HEADER_NOT_FOUND" | "PARSE_ERROR";
  message: string;
};

export type SinproParseResult =
  | { ok: true; rows: SinproParsedRow[]; total_geral?: number }
  | { ok: false; error: SinproParseError };

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]+/g, " ")
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

const isEmptyRow = (row: (string | number)[]) =>
  row.every((cell) => {
    if (cell === null || cell === undefined) return true;
    if (typeof cell === "number") return false;
    return String(cell).trim() === "";
  });

const findHeaderRowIndex = (rows: (string | number)[][]) => {
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const normalized = row.map((cell) => normalizeText(String(cell ?? "")));
    if (
      normalized.includes("beneficiario") &&
      normalized.includes("nome") &&
      normalized.includes("cpf") &&
      normalized.some((cell) => cell.includes("valor"))
    ) {
      return i;
    }
  }
  return -1;
};

const findColumnIndex = (headers: (string | number)[], name: string) => {
  const normalizedHeaders = headers.map((header) =>
    normalizeText(String(header ?? "")),
  );
  return normalizedHeaders.findIndex(
    (header) => header === normalizeText(name),
  );
};

const parseContratoCodigo = (value: string) => {
  const match = value.match(/^(\d+)\s*-\s*/);
  return match ? match[1] : "";
};

export const parseSinproXlsx = (
  bytes: Buffer | ArrayBuffer | Uint8Array,
): SinproParseResult => {
  try {
    const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return {
        ok: false,
        error: {
          code: "SHEET_NOT_FOUND",
          message: "Planilha não encontrada no arquivo.",
        },
      };
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
    }) as (string | number)[][];

    let empresaNome = "";
    for (const row of rows) {
      const joined = row.map((cell) => String(cell ?? "")).join(" ");
      if (normalizeText(joined).includes("nome da escola")) {
        empresaNome =
          String(row[row.findIndex((cell) =>
            normalizeText(String(cell ?? "")).includes("nome da escola"),
          ) + 1] ?? "").trim() || empresaNome;
      }
    }

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
    const beneficiarioIndex = findColumnIndex(headerRow, "Beneficiário");
    const nomeIndex = findColumnIndex(headerRow, "Nome");
    const cpfIndex = findColumnIndex(headerRow, "CPF");
    const descricaoIndex = findColumnIndex(headerRow, "Descrição");
    const valorIndex = headerRow.findIndex((cell) =>
      normalizeText(String(cell ?? "")).includes("valor"),
    );

    if (
      beneficiarioIndex === -1 ||
      nomeIndex === -1 ||
      cpfIndex === -1 ||
      descricaoIndex === -1 ||
      valorIndex === -1
    ) {
      return {
        ok: false,
        error: {
          code: "HEADER_NOT_FOUND",
          message: "Cabeçalho esperado não encontrado na planilha.",
        },
      };
    }

    let currentContrato = "";
    let totalGeral: number | undefined;
    const result: SinproParsedRow[] = [];

    for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
      const row = rows[i] ?? [];
      if (isEmptyRow(row)) continue;

      const firstCell = String(row[0] ?? "").trim();
      const normalizedFirst = normalizeText(firstCell);

      if (normalizedFirst.includes("valor total")) {
        totalGeral = parseBrazilianMoney(String(row[valorIndex] ?? ""));
        continue;
      }

      const maybeContrato = parseContratoCodigo(firstCell);
      if (maybeContrato) {
        currentContrato = maybeContrato;
        continue;
      }

      if (normalizedFirst.includes("total")) {
        continue;
      }

      const parentesco = String(row[beneficiarioIndex] ?? "").trim();
      const nome = String(row[nomeIndex] ?? "").trim();
      const cpf = String(row[cpfIndex] ?? "").trim();
      const descricao = String(row[descricaoIndex] ?? "").trim();
      if (!nome && !cpf) continue;
      if (normalizeText(descricao).includes("total")) continue;

      const premio = parseBrazilianMoney(String(row[valorIndex] ?? ""));
      result.push({
        identificacao: cpf,
        nome,
        parentesco,
        premio,
        contrato_codigo: currentContrato,
        empresa_nome: empresaNome,
      });
    }

    return { ok: true, rows: result, total_geral: totalGeral };
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
