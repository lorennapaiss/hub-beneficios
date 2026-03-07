import "server-only";
import * as XLSX from "xlsx";

export type UnimedParsedRow = {
  identificacao: string;
  nome: string;
  parentesco: string;
  premio: number;
  contrato_codigo: string;
  empresa_nome: string;
  evento?: string;
  cpf_titular?: string;
  cpf_beneficiario?: string;
};

export type UnimedParseError = {
  code: "SHEET_NOT_FOUND" | "HEADER_NOT_FOUND" | "PARSE_ERROR";
  message: string;
};

export type UnimedParseResult =
  | { ok: true; rows: UnimedParsedRow[] }
  | { ok: false; error: UnimedParseError };

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]+/g, " ")
    .trim();

const parseNumber = (value: string | number) => {
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
      if (normalized === "valor") {
        return i;
      }
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

export const parseUnimedPoaXlsx = (
  bytes: Buffer | ArrayBuffer | Uint8Array,
): UnimedParseResult => {
  try {
    const buffer = Buffer.isBuffer(bytes)
      ? bytes
      : bytes instanceof ArrayBuffer
        ? Buffer.from(new Uint8Array(bytes))
        : Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames.find(
      (name) => normalizeText(name) === normalizeText("sheet1"),
    );

    if (!sheetName) {
      return {
        ok: false,
        error: {
          code: "SHEET_NOT_FOUND",
          message: "Aba Sheet1 não encontrada no arquivo.",
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
    const cnpjIndex = findColumnIndex(headerRow, "CNPJ_CONTRATANTE");
    const codContratanteIndex = findColumnIndex(headerRow, "COD_CONTRATANTE");
    const cpfTitularIndex = findColumnIndex(headerRow, "CPF_TITULAR");
    const cpfBenefIndex = findColumnIndex(headerRow, "CPF_BENEFICIARIO");
    const beneficiarioIndex = findColumnIndex(headerRow, "BENEFICIARIO");
    const valorIndex = findColumnIndex(headerRow, "VALOR");
    const eventoIndex = findColumnIndex(headerRow, "EVENTO");

    if (
      cnpjIndex === -1 ||
      codContratanteIndex === -1 ||
      cpfTitularIndex === -1 ||
      cpfBenefIndex === -1 ||
      beneficiarioIndex === -1 ||
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

    const lastNonEmptyIndex = findLastNonEmptyRowIndex(rows);
    const dataRows = rows.slice(headerRowIndex + 1, lastNonEmptyIndex + 1);
    const result: UnimedParsedRow[] = [];

    for (const row of dataRows) {
      if (isEmptyRow(row)) continue;
      const contratoCodigo = String(row[codContratanteIndex] ?? "").trim();
      const empresaNome = String(row[cnpjIndex] ?? "").trim();
      const cpfTitular = String(row[cpfTitularIndex] ?? "").trim();
      const cpfBenef = String(row[cpfBenefIndex] ?? "").trim();
      const nome = String(row[beneficiarioIndex] ?? "").trim();
      if (!nome && !cpfBenef) continue;
      const evento = eventoIndex >= 0 ? String(row[eventoIndex] ?? "").trim() : "";
      if (evento) {
        const normalizedEvento = normalizeText(evento);
        if (!normalizedEvento.includes("mensalidade")) {
          continue;
        }
      }

      const premioRaw = row[valorIndex] ?? "";
      const premio = parseNumber(String(premioRaw));

      const parentesco =
        cpfTitular && cpfBenef && cpfTitular === cpfBenef
          ? "TITULAR"
          : "DEPENDENTE";

      result.push({
        identificacao: cpfBenef || cpfTitular,
        nome,
        parentesco,
        premio,
        contrato_codigo: contratoCodigo,
        empresa_nome: empresaNome,
        evento: evento || undefined,
        cpf_titular: cpfTitular || undefined,
        cpf_beneficiario: cpfBenef || undefined,
      });
    }

    return { ok: true, rows: result };
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
