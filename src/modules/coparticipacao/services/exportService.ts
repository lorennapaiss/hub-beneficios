import type {
  CopayConfig,
  CopayRow,
  ProcessingResult,
} from "@/modules/coparticipacao/types/copay.types";
import {
  buildOutputFilename,
  formatCompetenciaDate,
} from "@/modules/coparticipacao/utils/mappings";
import { formatDecimalForTxt } from "@/modules/coparticipacao/utils/currency";

const escapeCsv = (value: string) =>
  value.includes(",") || value.includes("\"") || value.includes("\n")
    ? `"${value.replace(/"/g, "\"\"")}"`
    : value;

export const buildCopayTxt = (rows: CopayRow[], config: CopayConfig) => {
  const exportDate = formatCompetenciaDate(config.competencia, config.formato_data);
  const approvedRows = rows.filter(
    (row) => row.status === "OK" || row.status === "OK_MANUAL",
  );

  const content = approvedRows
    .map(
      (row) =>
        `${row.chapa_resolvida};${exportDate};${row.codigo_evento};000:00;0,00;${formatDecimalForTxt(
          row.valor_copay,
        )};0,00;N;`,
    )
    .join("\n");

  return {
    filename: buildOutputFilename(config.competencia, config.operadora, "txt"),
    content,
  };
};

export const buildInconsistenciesCsv = (rows: CopayRow[], config: CopayConfig) => {
  const header = ["nome_titular", "nome_beneficiario", "status", "motivo"];
  const lines = rows
    .filter((row) => row.status !== "OK" && row.status !== "OK_MANUAL")
    .map((row) =>
      [
        row.nome_titular_raw,
        row.nome_beneficiario_raw,
        row.status,
        row.motivo ?? "",
      ].map((value) => escapeCsv(String(value))).join(","),
    );

  return {
    filename: buildOutputFilename(config.competencia, config.operadora, "csv").replace(
      ".csv",
      "_inconsistencias.csv",
    ),
    content: [header.join(","), ...lines].join("\n"),
  };
};

export const buildProcessingSummaryCsv = (
  result: ProcessingResult,
  config: CopayConfig,
) => {
  const summary = result.summary;
  const rows = [
    ["competencia", config.competencia],
    ["operadora", config.operadora],
    ["total", String(summary.total)],
    ["aprovados", String(summary.aprovados)],
    ["ok", String(summary.ok)],
    ["ok_manual", String(summary.ok_manual)],
    ["pendencias", String(summary.pendencias)],
    ["inelegiveis", String(summary.inelegiveis)],
    ["invalidos", String(summary.invalidos)],
    ["nao_encontrados", String(summary.nao_encontrados)],
    ["ambiguos", String(summary.ambiguos)],
    ["valor_total_aprovado", String(summary.valor_total_aprovado)],
  ];

  return {
    filename: buildOutputFilename(config.competencia, config.operadora, "csv").replace(
      ".csv",
      "_resumo.csv",
    ),
    content: rows.map((row) => row.map(escapeCsv).join(",")).join("\n"),
  };
};

export const triggerDownload = (filename: string, content: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
