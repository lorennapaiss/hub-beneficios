import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseSulamericaXlsx } from "../src/server/faturas/sulamerica-parser";

const makeWorkbook = (sheets: Record<string, (string | number)[][]>) => {
  const workbook = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  });
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

describe("parseSulamericaXlsx", () => {
  it("exclui totalizadores e lê linhas válidas", () => {
    const bytes = makeWorkbook({
      SeguradosAtivos: [
        ["", "", ""],
        ["Cod. De Identificacao", "Nome Segurado", "Parentesco", "Prêmio"],
        ["0001", "Ana Silva", "Titular", "1.200,50"],
        ["0001", "TOTAL DA FAMILIA", "", "1.200,50"],
        ["0002", "João Souza", "Dependente", "300,00"],
      ],
    });

    const result = parseSulamericaXlsx(bytes);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(2);
    expect(result.rows.map((row) => row.nome)).toEqual([
      "Ana Silva",
      "João Souza",
    ]);
  });

  it("captura TOTAL GERAL sem duplicar soma", () => {
    const bytes = makeWorkbook({
      SeguradosAtivos: [
        ["Cod. De Identificacao", "Nome Segurado", "Parentesco", "Prêmio"],
        ["0001", "Ana Silva", "Titular", "100,00"],
        ["0002", "João Souza", "Dependente", "200,00"],
        ["", "TOTAL GERAL", "", "300,00"],
      ],
    });

    const result = parseSulamericaXlsx(bytes);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(2);
    const sum = result.rows.reduce((acc, row) => acc + row.premio, 0);
    expect(sum).toBe(300);
    expect(result.total_geral_premio).toBe(300);
  });

  it("falha quando a aba SeguradosAtivos não existe", () => {
    const bytes = makeWorkbook({
      OutraAba: [["Cod. De Identificacao", "Nome Segurado", "Prêmio"]],
    });

    const result = parseSulamericaXlsx(bytes);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("SHEET_NOT_FOUND");
  });

  it("interpreta valores monetários em formato BR", () => {
    const bytes = makeWorkbook({
      SeguradosAtivos: [
        ["Cod. De Identificacao", "Nome Segurado", "Parentesco", "Prêmio"],
        ["0001", "Ana Silva", "Titular", "120.494,47"],
      ],
    });

    const result = parseSulamericaXlsx(bytes);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0]?.premio).toBe(120494.47);
  });
});
