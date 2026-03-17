import "server-only";

import * as XLSX from "xlsx";
import type { PjBenefitConfig, PjFormValues, PjHealthDependent, PjInput } from "@/lib/schemas/pj";
import { PjInputSchema } from "@/lib/schemas/pj";
import { createPj } from "@/server/pjs";

type CsvRow = Record<string, string | number | boolean | undefined>;

type ImportResult = {
  row: number;
  nome?: string;
  status: "IMPORTED" | "ERROR";
  message: string;
  pj_id?: string;
};

const CSV_HEADERS = [
  "nome_completo",
  "nome_social",
  "cpf",
  "data_nascimento",
  "email",
  "telefone",
  "status_cadastro",
  "observacoes_cadastrais",
  "razao_social",
  "nome_fantasia",
  "cnpj",
  "qsa_recebido",
  "data_recebimento_qsa",
  "status_documental",
  "municipio_uf_empresa",
  "dados_bancarios",
  "observacoes_contratuais",
  "status_vinculo",
  "data_inicio",
  "data_termino_prevista",
  "data_encerramento_real",
  "tipo_contrato_categoria",
  "regime_operacional",
  "gestor_responsavel",
  "area",
  "marca",
  "unidade",
  "centro_custo",
  "empresa_alocacao",
  "tipo_prestacao",
  "jornada_dedicacao",
  "valor_mensal_contratado",
  "tipo_remuneracao",
  "valor_ajuda_custo",
  "valor_total_mensal_previsto",
  "data_base_reajuste",
  "historico_reajuste_resumo",
  "status_pagamento",
  "ultima_competencia_paga",
  "observacoes_financeiras",
  "beneficios.plano_saude.elegivel",
  "beneficios.plano_saude.status",
  "beneficios.plano_saude.fornecedor",
  "beneficios.plano_saude.produto_plano",
  "beneficios.plano_saude.tipo_custeio",
  "beneficios.plano_saude.data_inclusao",
  "beneficios.plano_saude.data_exclusao",
  "beneficios.plano_saude.subsidio_empresa",
  "beneficios.plano_saude.custo_mensal",
  "beneficios.plano_saude.coparticipacao_aplicavel",
  "beneficios.plano_saude.observacoes_regra",
  "beneficios.plano_saude.dependentes_json",
  "beneficios.plano_odontologico.elegivel",
  "beneficios.plano_odontologico.status",
  "beneficios.plano_odontologico.fornecedor",
  "beneficios.plano_odontologico.produto_plano",
  "beneficios.plano_odontologico.tipo_custeio",
  "beneficios.plano_odontologico.data_inclusao",
  "beneficios.plano_odontologico.data_exclusao",
  "beneficios.plano_odontologico.subsidio_empresa",
  "beneficios.plano_odontologico.custo_mensal",
  "beneficios.plano_odontologico.coparticipacao_aplicavel",
  "beneficios.plano_odontologico.observacoes_regra",
  "beneficios.vt.elegivel",
  "beneficios.vt.status",
  "beneficios.vt.fornecedor",
  "beneficios.vt.produto_plano",
  "beneficios.vt.tipo_custeio",
  "beneficios.vt.data_inclusao",
  "beneficios.vt.data_exclusao",
  "beneficios.vt.subsidio_empresa",
  "beneficios.vt.custo_mensal",
  "beneficios.vt.coparticipacao_aplicavel",
  "beneficios.vt.observacoes_regra",
  "beneficios.vr_va.elegivel",
  "beneficios.vr_va.status",
  "beneficios.vr_va.fornecedor",
  "beneficios.vr_va.produto_plano",
  "beneficios.vr_va.tipo_custeio",
  "beneficios.vr_va.data_inclusao",
  "beneficios.vr_va.data_exclusao",
  "beneficios.vr_va.subsidio_empresa",
  "beneficios.vr_va.custo_mensal",
  "beneficios.vr_va.coparticipacao_aplicavel",
  "beneficios.vr_va.observacoes_regra",
  "documentacao_pendente",
] as const;

const normalize = (value: unknown) => String(value ?? "").trim();

const parseBoolean = (value: unknown) => {
  const normalized = normalize(value).toLowerCase();
  return ["true", "1", "sim", "yes", "y"].includes(normalized);
};

const parseNumber = (value: unknown) => {
  const raw = normalize(value);
  if (!raw) return 0;
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDependentes = (value: unknown): PjHealthDependent[] => {
  const raw = normalize(value);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PjHealthDependent[]) : [];
  } catch {
    throw new Error("Campo beneficios.plano_saude.dependentes_json invalido. Use JSON array.");
  }
};

const parseBenefitStatus = (value: unknown): PjBenefitConfig["status"] => {
  const normalized = normalize(value);
  return normalized === "ATIVO" || normalized === "ENCERRADO" || normalized === "NAO_CONCEDIDO"
    ? normalized
    : "NAO_CONCEDIDO";
};

const getBenefit = (
  row: CsvRow,
  key: "plano_saude" | "plano_odontologico" | "vt" | "vr_va",
) => ({
  elegivel: parseBoolean(row[`beneficios.${key}.elegivel`]),
  status: parseBenefitStatus(row[`beneficios.${key}.status`]),
  fornecedor: normalize(row[`beneficios.${key}.fornecedor`]),
  produto_plano: normalize(row[`beneficios.${key}.produto_plano`]),
  tipo_custeio: normalize(row[`beneficios.${key}.tipo_custeio`]),
  data_inclusao: normalize(row[`beneficios.${key}.data_inclusao`]),
  data_exclusao: normalize(row[`beneficios.${key}.data_exclusao`]),
  subsidio_empresa: parseNumber(row[`beneficios.${key}.subsidio_empresa`]),
  custo_mensal: parseNumber(row[`beneficios.${key}.custo_mensal`]),
  coparticipacao_aplicavel: parseBoolean(row[`beneficios.${key}.coparticipacao_aplicavel`]),
  observacoes_regra: normalize(row[`beneficios.${key}.observacoes_regra`]),
});

const rowToInput = (row: CsvRow): PjInput => {
  const draft: PjFormValues = {
    nome_completo: normalize(row.nome_completo),
    nome_social: normalize(row.nome_social),
    cpf: normalize(row.cpf),
    data_nascimento: normalize(row.data_nascimento),
    email: normalize(row.email),
    telefone: normalize(row.telefone),
    status_cadastro: (normalize(row.status_cadastro) || "PENDENTE") as PjFormValues["status_cadastro"],
    observacoes_cadastrais: normalize(row.observacoes_cadastrais),
    razao_social: normalize(row.razao_social),
    nome_fantasia: normalize(row.nome_fantasia),
    cnpj: normalize(row.cnpj),
    qsa_recebido: parseBoolean(row.qsa_recebido),
    data_recebimento_qsa: normalize(row.data_recebimento_qsa),
    status_documental: (normalize(row.status_documental) ||
      "PENDENTE") as PjFormValues["status_documental"],
    municipio_uf_empresa: normalize(row.municipio_uf_empresa),
    dados_bancarios: normalize(row.dados_bancarios),
    observacoes_contratuais: normalize(row.observacoes_contratuais),
    status_vinculo: (normalize(row.status_vinculo) || "EM_ATIVACAO") as PjFormValues["status_vinculo"],
    data_inicio: normalize(row.data_inicio),
    data_termino_prevista: normalize(row.data_termino_prevista),
    data_encerramento_real: normalize(row.data_encerramento_real),
    tipo_contrato_categoria: normalize(row.tipo_contrato_categoria),
    regime_operacional: normalize(row.regime_operacional),
    gestor_responsavel: normalize(row.gestor_responsavel),
    area: normalize(row.area),
    marca: normalize(row.marca),
    unidade: normalize(row.unidade),
    centro_custo: normalize(row.centro_custo),
    empresa_alocacao: normalize(row.empresa_alocacao),
    tipo_prestacao: normalize(row.tipo_prestacao),
    jornada_dedicacao: normalize(row.jornada_dedicacao),
    valor_mensal_contratado: parseNumber(row.valor_mensal_contratado),
    tipo_remuneracao: (normalize(row.tipo_remuneracao) || "FIXO") as PjFormValues["tipo_remuneracao"],
    valor_ajuda_custo: parseNumber(row.valor_ajuda_custo),
    valor_total_mensal_previsto: parseNumber(row.valor_total_mensal_previsto),
    data_base_reajuste: normalize(row.data_base_reajuste),
    historico_reajuste_resumo: normalize(row.historico_reajuste_resumo),
    status_pagamento: normalize(row.status_pagamento),
    ultima_competencia_paga: normalize(row.ultima_competencia_paga),
    observacoes_financeiras: normalize(row.observacoes_financeiras),
    beneficios: {
      plano_saude: {
        ...getBenefit(row, "plano_saude"),
        dependentes: parseDependentes(row["beneficios.plano_saude.dependentes_json"]),
      },
      plano_odontologico: getBenefit(row, "plano_odontologico"),
      vt: getBenefit(row, "vt"),
      vr_va: getBenefit(row, "vr_va"),
    },
    documentacao_pendente: parseBoolean(row.documentacao_pendente),
  };

  return PjInputSchema.parse(draft);
};

export const getPjImportCsvTemplate = () => `${CSV_HEADERS.join(",")}\n`;

export const importPjsFromCsvBuffer = async (buffer: Buffer, actor: string) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Arquivo CSV vazio.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<CsvRow>(sheet, {
    defval: "",
    raw: false,
  });

  const results: ImportResult[] = [];

  for (const [index, row] of rows.entries()) {
    try {
      const input = rowToInput(row);
      const created = await createPj(input, actor);
      results.push({
        row: index + 2,
        nome: input.nome_completo,
        status: "IMPORTED",
        message: "PJ importado com sucesso.",
        pj_id: created.pj_id,
      });
    } catch (error) {
      results.push({
        row: index + 2,
        nome: normalize(row.nome_completo),
        status: "ERROR",
        message: error instanceof Error ? error.message : "Erro ao importar linha.",
      });
    }
  }

  return {
    total: rows.length,
    imported: results.filter((item) => item.status === "IMPORTED").length,
    errors: results.filter((item) => item.status === "ERROR").length,
    results,
    headers: CSV_HEADERS,
  };
};
