import "server-only";

import { format, parse, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createUuid } from "@/lib/uuid";
import { appendRow, getRowsCached } from "@/server/sheets";
import {
  listPjHealthDescriptiveHistory,
  PJ_DESCRITIVO_CONFIG_SHEET,
  PJ_DESCRITIVO_ENTRY_SHEET,
  PJ_DESCRITIVO_HISTORY_SHEET,
  type PjHealthDescriptiveConfigRow,
  type PjHealthDescriptiveEntryRow,
  type PjHealthDescriptiveHistoryRow,
} from "@/server/pj-health-descriptive-store";
import { getPjById, listPjs, type PjListItem } from "@/server/pjs";

type DescriptiveLine = {
  beneficiario: string;
  tipo: string;
  vinculoDependente: string;
  operadora: string;
  produtoPlano: string;
  regraSubsidio: string;
  mensalidade: number;
  subsidioEmpresa: number;
  coparticipacao: number;
  valorDevido: number;
  observacoes: string;
};

export type PjHealthDescriptivePreview = {
  pjId: string;
  competencia: string;
  competenciaLabel: string;
  arquivoNome: string;
  empresa: {
    razaoSocial: string;
    cnpj: string;
    endereco: string;
    cep: string;
  };
  prestador: {
    nome: string;
    cpf: string;
    cnpj: string;
    statusVinculo: string;
  };
  textoIntrodutorio: string;
  observacoes: string[];
  linhas: DescriptiveLine[];
  totais: {
    totalPlano: number;
    totalSubsidio: number;
    totalCoparticipacao: number;
    totalDevido: number;
  };
  inconsistencias: string[];
  bloqueado: boolean;
  historico: PjHealthDescriptiveHistoryRow[];
};

type GenerateOptions = {
  persist: boolean;
  actor: string;
};

const defaultConfig: PjHealthDescriptiveConfigRow = {
  config_id: "global",
  razao_social_emissora: "Empresa emissora nao configurada",
  cnpj_emissora: "",
  endereco_emissora: "",
  cep_emissora: "",
  texto_introdutorio:
    "Em conformidade com a politica de beneficios vigente e com o contrato de prestacao de servicos, os valores de mensalidade e coparticipacao do plano de saude serao considerados para desconto na proxima emissao de Nota Fiscal.",
  texto_observacoes:
    "Subsidio conforme politica corporativa vigente.|Valores referentes a competencia selecionada.|Desconto a ser considerado na proxima emissao de Nota Fiscal.",
  politica_geracao_valor_zero: "false",
  formato_competencia: "MMMM/yyyy",
  formato_moeda: "BRL",
  nome_arquivo: "descritivo_desconto_plano_saude_[competencia]_[nome_pj].html",
  template_visual: "default",
  created_at: "",
  created_by: "",
  updated_at: "",
  updated_by: "",
};

const normalize = (value?: string | null) => value?.trim() ?? "";

const parseNumber = (value?: string | null) => {
  const raw = normalize(value);
  if (!raw) return 0;
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseBoolean = (value?: string | null) => normalize(value).toLowerCase() === "true";

const formatCompetenciaLabel = (competencia: string, pattern: string) => {
  try {
    const date = parse(`${competencia}-01`, "yyyy-MM-dd", new Date());
    return format(date, pattern || "MMMM/yyyy", { locale: ptBR });
  } catch {
    return competencia;
  }
};

const formatArquivoNome = (pattern: string, competencia: string, nomePj: string) =>
  (pattern || defaultConfig.nome_arquivo)
    .replace("[competencia]", competencia)
    .replace("[nome_pj]", slugify(nomePj));

const slugify = (value: string) =>
  normalize(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

const safeParseDate = (value?: string | null) => {
  const normalized = normalize(value);
  if (!normalized) return null;
  try {
    return parseISO(normalized);
  } catch {
    return null;
  }
};

const isEntryActiveInCompetencia = (
  entry: PjHealthDescriptiveEntryRow,
  competencia: string,
) => {
  if (normalize(entry.beneficio_status) && normalize(entry.beneficio_status) !== "ATIVO") {
    return false;
  }

  const competenciaDate = parse(`${competencia}-01`, "yyyy-MM-dd", new Date());
  const start = safeParseDate(entry.data_inclusao);
  const end = safeParseDate(entry.data_exclusao);
  const competenciaKey = format(competenciaDate, "yyyy-MM");

  if (start && format(start, "yyyy-MM") > competenciaKey) return false;
  if (end && format(end, "yyyy-MM") < competenciaKey) return false;
  return true;
};

const computeSubsidio = (entry: PjHealthDescriptiveEntryRow, pj: PjListItem) => {
  const mensalidade = parseNumber(entry.mensalidade);
  const subsidyType = normalize(entry.subsidio_tipo).toUpperCase();
  const subsidyValue = parseNumber(entry.subsidio_valor);
  const fallback = parseNumber(pj.subsidio_empresa);

  let subsidioEmpresa = fallback;
  if (subsidyType === "PERCENTUAL") {
    subsidioEmpresa = (mensalidade * subsidyValue) / 100;
  } else if (subsidyType === "VALOR") {
    subsidioEmpresa = subsidyValue;
  } else if (subsidyType === "INTEGRAL") {
    subsidioEmpresa = mensalidade;
  }

  return Math.max(0, Math.min(subsidioEmpresa, mensalidade));
};

const ensureCriticalFields = (pj: PjListItem, competencia: string) => {
  const inconsistencias: string[] = [];
  const elegivelPlanoSaude = normalize(pj.elegivel_plano_saude).toLowerCase() === "true";

  if (!normalize(competencia)) inconsistencias.push("Competencia obrigatoria.");
  if (!normalize(pj.nome_completo)) inconsistencias.push("PJ sem nome completo.");
  if (!normalize(pj.cpf)) inconsistencias.push("PJ sem CPF.");
  if (!normalize(pj.cnpj)) inconsistencias.push("PJ sem CNPJ.");
  if (!elegivelPlanoSaude || pj.status_beneficio !== "ATIVO") {
    inconsistencias.push("PJ sem beneficio de saude ativo na configuracao atual.");
  }

  return inconsistencias;
};

const getConfig = async () => {
  try {
    const rows = (await getRowsCached(PJ_DESCRITIVO_CONFIG_SHEET)) as PjHealthDescriptiveConfigRow[];
    return rows[0] ? { ...defaultConfig, ...rows[0] } : defaultConfig;
  } catch {
    return defaultConfig;
  }
};

const buildPreview = async (
  pjId: string,
  competencia: string,
): Promise<PjHealthDescriptivePreview> => {
  const pj = await getPjById(pjId);
  if (!pj) {
    throw new Error("PJ nao encontrado.");
  }

  const [config, history] = await Promise.all([
    getConfig(),
    listPjHealthDescriptiveHistory(pjId),
  ]);

  const inconsistencias = ensureCriticalFields(pj, competencia);

  let entries: PjHealthDescriptiveEntryRow[] = [];
  try {
    const rows = (await getRowsCached(PJ_DESCRITIVO_ENTRY_SHEET)) as PjHealthDescriptiveEntryRow[];
    entries = rows.filter((row) => row.pj_id === pjId && row.competencia === competencia);
  } catch {
    entries = [];
  }

  if (entries.length === 0) {
    inconsistencias.push("Nenhum item financeiro encontrado para a competencia selecionada.");
  }

  const activeEntries = entries.filter((entry) => isEntryActiveInCompetencia(entry, competencia));
  if (entries.length > 0 && activeEntries.length === 0) {
    inconsistencias.push("Nenhum beneficiario ativo na competencia selecionada.");
  }

  const linhas = activeEntries.map((entry) => {
    const mensalidade = parseNumber(entry.mensalidade);
    const subsidioEmpresa = computeSubsidio(entry, pj);
    const coparticipacao = parseNumber(entry.coparticipacao);
    const valorDevido = Math.max(0, mensalidade - subsidioEmpresa + coparticipacao);

    if (!normalize(entry.beneficiario_nome)) {
      inconsistencias.push("Existe beneficiario sem identificacao.");
    }

    return {
      beneficiario: entry.beneficiario_nome,
      tipo: entry.beneficiario_tipo || "Titular",
      vinculoDependente: entry.dependente_vinculo,
      operadora: entry.operadora,
      produtoPlano: entry.produto_plano || pj.produto_plano,
      regraSubsidio: entry.regra_subsidio || pj.observacoes_regra,
      mensalidade,
      subsidioEmpresa,
      coparticipacao,
      valorDevido,
      observacoes: entry.observacoes,
    };
  });

  if (linhas.some((linha) => linha.valorDevido < 0 || linha.subsidioEmpresa > linha.mensalidade)) {
    inconsistencias.push(
      "Os valores calculados resultaram em subsidio acima do plano ou valor devido negativo.",
    );
  }

  const totalPlano = linhas.reduce((acc, linha) => acc + linha.mensalidade, 0);
  const totalSubsidio = linhas.reduce((acc, linha) => acc + linha.subsidioEmpresa, 0);
  const totalCoparticipacao = linhas.reduce((acc, linha) => acc + linha.coparticipacao, 0);
  const totalDevido = linhas.reduce((acc, linha) => acc + linha.valorDevido, 0);

  const consolidatedValue = entries
    .map((entry) => parseNumber(entry.total_consolidado_competencia))
    .find((value) => value > 0);

  if (consolidatedValue !== undefined && Math.abs(consolidatedValue - totalDevido) > 0.01) {
    inconsistencias.push("Divergencia entre total calculado e total consolidado da competencia.");
  }

  if (!parseBoolean(config.politica_geracao_valor_zero) && totalDevido <= 0) {
    inconsistencias.push("Politica atual bloqueia geracao com valor total zerado.");
  }

  return {
    pjId,
    competencia,
    competenciaLabel: formatCompetenciaLabel(competencia, config.formato_competencia),
    arquivoNome: formatArquivoNome(config.nome_arquivo, competencia, pj.nome_completo),
    empresa: {
      razaoSocial: config.razao_social_emissora,
      cnpj: config.cnpj_emissora,
      endereco: config.endereco_emissora,
      cep: config.cep_emissora,
    },
    prestador: {
      nome: pj.nome_completo,
      cpf: pj.cpf,
      cnpj: pj.cnpj,
      statusVinculo: pj.status_vinculo,
    },
    textoIntrodutorio: config.texto_introdutorio,
    observacoes: config.texto_observacoes
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean),
    linhas,
    totais: {
      totalPlano,
      totalSubsidio,
      totalCoparticipacao,
      totalDevido,
    },
    inconsistencias: Array.from(new Set(inconsistencias)),
    bloqueado: inconsistencias.length > 0,
    historico: history,
  };
};

const persistHistory = async (
  preview: PjHealthDescriptivePreview,
  actor: string,
) => {
  const versions = preview.historico.filter((item) => item.competencia === preview.competencia);
  const versao = versions.length + 1;
  const now = new Date().toISOString();
  const row: PjHealthDescriptiveHistoryRow = {
    pj_descritivo_geracao_id: createUuid(),
    pj_id: preview.pjId,
    competencia: preview.competencia,
    status: "GERADO",
    versao: String(versao),
    total_beneficiarios: String(preview.linhas.length),
    total_plano: String(preview.totais.totalPlano),
    total_subsidio: String(preview.totais.totalSubsidio),
    total_coparticipacao: String(preview.totais.totalCoparticipacao),
    total_devido: String(preview.totais.totalDevido),
    arquivo_nome: preview.arquivoNome,
    snapshot_json: JSON.stringify(preview),
    inconsistencias_json: JSON.stringify(preview.inconsistencias),
    generated_at: now,
    generated_by: actor,
  };

  await appendRow(PJ_DESCRITIVO_HISTORY_SHEET, row);
  return row;
};

export const getPjHealthDescriptivePreview = async (pjId: string, competencia: string) =>
  buildPreview(pjId, competencia);

export const generatePjHealthDescriptive = async (
  pjId: string,
  competencia: string,
  options: GenerateOptions,
) => {
  const preview = await buildPreview(pjId, competencia);

  if (preview.bloqueado) {
    throw new Error(preview.inconsistencias.join(" "));
  }

  if (options.persist) {
    const generation = await persistHistory(preview, options.actor);
    return {
      ...preview,
      historico: [generation, ...preview.historico],
    };
  }

  return preview;
};

export const generatePjHealthDescriptiveBatch = async (
  competencia: string,
  actor: string,
) => {
  const { rows } = await listPjs({
    status_vinculo: "ATIVO",
    limit: 500,
    offset: 0,
  });

  const elegiveis = rows.filter(
    (row) => normalize(row.elegivel_plano_saude).toLowerCase() === "true",
  );

  const results = await Promise.all(
    elegiveis.map(async (row) => {
      try {
        const preview = await generatePjHealthDescriptive(row.pj_id, competencia, {
          persist: true,
          actor,
        });

        return {
          pj_id: row.pj_id,
          nome: row.nome_completo,
          status: "GERADO",
          total_devido: preview.totais.totalDevido,
          inconsistencias: [] as string[],
        };
      } catch (error) {
        return {
          pj_id: row.pj_id,
          nome: row.nome_completo,
          status: "ERRO",
          total_devido: 0,
          inconsistencias: [error instanceof Error ? error.message : "Erro ao gerar descritivo."],
        };
      }
    }),
  );

  return {
    competencia,
    totalElegiveis: elegiveis.length,
    gerados: results.filter((item) => item.status === "GERADO").length,
    erros: results.filter((item) => item.status === "ERRO").length,
    resultados: results,
  };
};
