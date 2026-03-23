import "server-only";

import { createUuid } from "@/lib/uuid";
import type {
  PjBenefitConfig,
  PjBenefits,
  PjHealthBenefitConfig,
  PjHealthDependent,
  PjInput,
} from "@/lib/schemas/pj";
import {
  listPjHealthDescriptiveHistory,
  type PjHealthDescriptiveHistoryRow,
} from "@/server/pj-health-descriptive-store";
import { appendRow, findById, getRowsCached, updateRowById } from "@/server/sheets";

export type PjRow = {
  pj_id: string;
  nome_completo: string;
  nome_social: string;
  cpf: string;
  data_nascimento: string;
  email: string;
  telefone: string;
  status_cadastro: string;
  observacoes_cadastrais: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  qsa_recebido: string;
  data_recebimento_qsa: string;
  status_documental: string;
  municipio_uf_empresa: string;
  dados_bancarios: string;
  observacoes_contratuais: string;
  status_vinculo: string;
  data_inicio: string;
  data_termino_prevista: string;
  data_encerramento_real: string;
  tipo_contrato_categoria: string;
  regime_operacional: string;
  gestor_responsavel: string;
  area: string;
  marca: string;
  unidade: string;
  centro_custo: string;
  empresa_alocacao: string;
  tipo_prestacao: string;
  jornada_dedicacao: string;
  valor_mensal_contratado: string;
  tipo_remuneracao: string;
  valor_ajuda_custo: string;
  valor_total_mensal_previsto: string;
  data_base_reajuste: string;
  historico_reajuste_resumo: string;
  status_pagamento: string;
  ultima_competencia_paga: string;
  observacoes_financeiras: string;
  elegivel_plano_saude: string;
  elegivel_plano_odontologico: string;
  elegivel_vt: string;
  elegivel_vr_va: string;
  beneficios_concedidos_resumo: string;
  fornecedor_beneficio: string;
  produto_plano: string;
  data_inclusao_beneficio: string;
  data_exclusao_beneficio: string;
  tipo_custeio: string;
  subsidio_empresa: string;
  coparticipacao_aplicavel: string;
  status_beneficio: string;
  observacoes_regra: string;
  custo_beneficios_mensal: string;
  documentacao_pendente: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
};

export type PjFinancialHistoryRow = {
  pj_financial_history_id: string;
  pj_id: string;
  data_vigencia: string;
  valor_mensal_contratado: string;
  valor_ajuda_custo: string;
  valor_total_mensal_previsto: string;
  tipo_remuneracao: string;
  observacoes: string;
  created_at: string;
  created_by: string;
};

export type PjBenefitHistoryRow = {
  pj_benefit_id: string;
  pj_id: string;
  beneficio: string;
  fornecedor: string;
  produto_plano: string;
  status: string;
  elegivel: string;
  concedido: string;
  data_inclusao: string;
  data_exclusao: string;
  tipo_custeio: string;
  subsidio_empresa: string;
  coparticipacao: string;
  observacoes: string;
  created_at: string;
  created_by: string;
};

export type PjAllocationHistoryRow = {
  pj_allocation_id: string;
  pj_id: string;
  marca: string;
  unidade: string;
  area: string;
  gestor_responsavel: string;
  centro_custo: string;
  empresa_alocacao: string;
  status_vinculo: string;
  data_inicio: string;
  data_fim: string;
  observacoes: string;
  created_at: string;
  created_by: string;
};

type ListPjsParams = {
  search?: string;
  status_vinculo?: string;
  marca?: string;
  area?: string;
  gestor_responsavel?: string;
  centro_custo?: string;
  status_documental?: string;
  benefit_status?: string;
  limit?: number;
  offset?: number;
};

export type PjListItem = PjRow & {
  custo_total_mensal: number;
  percentual_beneficios: number;
  flag_inconsistencia: boolean;
  flag_documental_pendente: boolean;
  flag_sem_centro_custo: boolean;
  flag_sem_beneficio_configurado: boolean;
  pendencias: string[];
};

export type PjSummary = {
  total: number;
  ativos: number;
  pendenciasDocumentais: number;
  alocacaoIncompleta: number;
  semBeneficioConfigurado: number;
  custoTotalMensal: number;
};

export type PjDetail = {
  pj: PjListItem;
  financialHistory: PjFinancialHistoryRow[];
  benefitHistory: PjBenefitHistoryRow[];
  allocationHistory: PjAllocationHistoryRow[];
  descriptiveHistory: PjHealthDescriptiveHistoryRow[];
};

const BENEFIT_FIELD_MAP = {
  plano_saude: {
    label: "PLANO_SAUDE",
    elegivelField: "elegivel_plano_saude",
  },
  plano_odontologico: {
    label: "PLANO_ODONTO",
    elegivelField: "elegivel_plano_odontologico",
  },
  vt: {
    label: "VT",
    elegivelField: "elegivel_vt",
  },
  vr_va: {
    label: "VR_VA",
    elegivelField: "elegivel_vr_va",
  },
} satisfies Record<
  keyof PjBenefits,
  {
    label: string;
    elegivelField: keyof Pick<
      PjRow,
      | "elegivel_plano_saude"
      | "elegivel_plano_odontologico"
      | "elegivel_vt"
      | "elegivel_vr_va"
    >;
  }
>;

const normalize = (value?: string | null) => value?.trim() ?? "";
const getNow = () => new Date().toISOString();
const isMissingSheetError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("unable to parse range") ||
    message.includes("não foi possível analisar o intervalo") ||
    message.includes("nao foi possivel analisar o intervalo") ||
    message.includes("not found") ||
    message.includes("invalid requests[0].addsheet")
  );
};

const safeGetRowsCached = async <T>(sheetName: string) => {
  try {
    return (await getRowsCached(sheetName)) as T[];
  } catch (error) {
    if (isMissingSheetError(error)) {
      return [];
    }
    throw error;
  }
};

const parseNumber = (value?: string | null) => {
  const raw = normalize(value);
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
const parseBoolean = (value?: string | null) => normalize(value).toLowerCase() === "true";
const isActiveStatus = (value: string) => ["ATIVO", "EM_ATIVACAO"].includes(value);

const sanitizeBenefit = (benefit: PjBenefitConfig): PjBenefitConfig => ({
  ...benefit,
  fornecedor: normalize(benefit.fornecedor),
  produto_plano: normalize(benefit.produto_plano),
  tipo_custeio: normalize(benefit.tipo_custeio),
  data_inclusao: normalize(benefit.data_inclusao),
  data_exclusao: normalize(benefit.data_exclusao),
  observacoes_regra: normalize(benefit.observacoes_regra),
});

const sanitizeDependent = (dependent: PjHealthDependent): PjHealthDependent => ({
  ...dependent,
  nome: normalize(dependent.nome),
  parentesco: normalize(dependent.parentesco),
  data_inclusao: normalize(dependent.data_inclusao),
  data_exclusao: normalize(dependent.data_exclusao),
  observacoes: normalize(dependent.observacoes),
});

const sanitizeHealthBenefit = (
  benefit: PjHealthBenefitConfig
): PjHealthBenefitConfig => ({
  ...sanitizeBenefit(benefit),
  dependentes: benefit.dependentes.map(sanitizeDependent),
});

const getBenefitEntries = (beneficios: PjBenefits) =>
  (Object.entries(beneficios) as Array<[keyof PjBenefits, PjBenefitConfig]>).map(
    ([key, value]) => [key, value] as const
  );

const hasConfiguredBenefitData = (benefit: PjBenefitConfig) =>
  benefit.elegivel ||
  benefit.status !== "NAO_CONCEDIDO" ||
  Boolean(
    normalize(benefit.fornecedor) ||
    normalize(benefit.produto_plano) ||
    normalize(benefit.tipo_custeio) ||
    normalize(benefit.data_inclusao) ||
    normalize(benefit.data_exclusao) ||
    normalize(benefit.observacoes_regra)
  ) ||
  benefit.subsidio_empresa > 0 ||
  benefit.custo_mensal > 0 ||
  benefit.coparticipacao_aplicavel;

const hasConfiguredDependentData = (dependent: PjHealthDependent) =>
  Boolean(
    normalize(dependent.nome) ||
    normalize(dependent.parentesco) ||
    normalize(dependent.data_inclusao) ||
    normalize(dependent.data_exclusao) ||
    normalize(dependent.observacoes)
  ) ||
  dependent.subsidio_empresa > 0 ||
  dependent.custo_mensal > 0 ||
  dependent.coparticipacao_aplicavel;

const getPrimaryBenefit = (beneficios: PjBenefits) =>
  beneficios.plano_saude.elegivel || hasConfiguredBenefitData(beneficios.plano_saude)
    ? beneficios.plano_saude
    : (getBenefitEntries(beneficios).find(([, benefit]) =>
        hasConfiguredBenefitData(benefit)
      )?.[1] ?? beneficios.plano_saude);

const getBenefitSummary = (beneficios: PjBenefits) => {
  const configured = getBenefitEntries(beneficios).filter(([, benefit]) =>
    hasConfiguredBenefitData(benefit)
  );
  const active = configured.filter(([, benefit]) => benefit.status === "ATIVO");
  const primary = getPrimaryBenefit(beneficios);
  const benefitNames = active.length > 0 ? active : configured;
  const dependenteCost = beneficios.plano_saude.dependentes.reduce(
    (total, dependent) => total + dependent.custo_mensal,
    0
  );
  const dependenteOdontoCost = beneficios.plano_odontologico.dependentes.reduce(
    (total, dependent) => total + dependent.custo_mensal,
    0
  );

  return {
    beneficios_concedidos_resumo: benefitNames
      .map(([key]) => BENEFIT_FIELD_MAP[key].label)
      .join(", "),
    fornecedor_beneficio: normalize(primary.fornecedor),
    produto_plano: normalize(primary.produto_plano),
    data_inclusao_beneficio: normalize(primary.data_inclusao),
    data_exclusao_beneficio: normalize(primary.data_exclusao),
    tipo_custeio: normalize(primary.tipo_custeio),
    subsidio_empresa: String(primary.subsidio_empresa),
    coparticipacao_aplicavel: String(primary.coparticipacao_aplicavel),
    status_beneficio: primary.status,
    observacoes_regra: normalize(primary.observacoes_regra),
    custo_beneficios_mensal: String(
      getBenefitEntries(beneficios).reduce(
        (total, [, benefit]) => total + benefit.custo_mensal,
        0
      ) +
        dependenteCost +
        dependenteOdontoCost
    ),
  };
};

const serializeHealthDependent = (dependent: PjHealthDependent) =>
  `DEPENDENTE::${JSON.stringify(dependent)}`;

export const parseHealthDependentObservation = (value?: string) => {
  const normalized = normalize(value);
  if (!normalized.startsWith("DEPENDENTE::")) return null;

  try {
    return JSON.parse(normalized.slice("DEPENDENTE::".length)) as PjHealthDependent;
  } catch {
    return null;
  }
};

const appendDependentBenefitHistory = async (
  pjId: string,
  benefitLabel: "PLANO_SAUDE_DEPENDENTE" | "PLANO_ODONTO_DEPENDENTE",
  benefit: PjHealthBenefitConfig,
  actor: string
) => {
  for (const dependent of benefit.dependentes) {
    if (!hasConfiguredDependentData(dependent)) continue;

    await appendRow("pj_benefits", {
      pj_benefit_id: createUuid(),
      pj_id: pjId,
      beneficio: benefitLabel,
      fornecedor: benefit.fornecedor,
      produto_plano: dependent.nome,
      status: benefit.status,
      elegivel: "true",
      concedido: String(benefit.status === "ATIVO"),
      data_inclusao: dependent.data_inclusao,
      data_exclusao: dependent.data_exclusao,
      tipo_custeio: dependent.parentesco,
      subsidio_empresa: String(dependent.subsidio_empresa),
      coparticipacao: String(dependent.coparticipacao_aplicavel),
      observacoes: serializeHealthDependent(dependent),
      created_at: getNow(),
      created_by: actor,
    });
  }
};

const appendAudit = async (
  action: "CREATE" | "UPDATE",
  pjId: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
  createdBy: string
) => {
  await appendRow("audit_log", {
    audit_id: createUuid(),
    entity_type: "pj",
    entity_id: pjId,
    action,
    before_json: before ? JSON.stringify(before) : "",
    after_json: JSON.stringify(after),
    created_at: getNow(),
    created_by: createdBy,
  });
};

const sanitizeInput = (data: PjInput) => ({
  ...data,
  nome_completo: normalize(data.nome_completo),
  nome_social: normalize(data.nome_social),
  cpf: normalize(data.cpf),
  data_nascimento: normalize(data.data_nascimento),
  email: normalize(data.email),
  telefone: normalize(data.telefone),
  status_cadastro: normalize(data.status_cadastro),
  observacoes_cadastrais: normalize(data.observacoes_cadastrais),
  razao_social: normalize(data.razao_social),
  nome_fantasia: normalize(data.nome_fantasia),
  cnpj: normalize(data.cnpj),
  data_recebimento_qsa: normalize(data.data_recebimento_qsa),
  status_documental: normalize(data.status_documental),
  municipio_uf_empresa: normalize(data.municipio_uf_empresa),
  dados_bancarios: normalize(data.dados_bancarios),
  observacoes_contratuais: normalize(data.observacoes_contratuais),
  status_vinculo: normalize(data.status_vinculo),
  data_inicio: normalize(data.data_inicio),
  data_termino_prevista: normalize(data.data_termino_prevista),
  data_encerramento_real: normalize(data.data_encerramento_real),
  tipo_contrato_categoria: normalize(data.tipo_contrato_categoria),
  regime_operacional: normalize(data.regime_operacional),
  gestor_responsavel: normalize(data.gestor_responsavel),
  area: normalize(data.area),
  marca: normalize(data.marca),
  unidade: normalize(data.unidade),
  centro_custo: normalize(data.centro_custo),
  empresa_alocacao: normalize(data.empresa_alocacao),
  tipo_prestacao: normalize(data.tipo_prestacao),
  jornada_dedicacao: normalize(data.jornada_dedicacao),
  data_base_reajuste: normalize(data.data_base_reajuste),
  historico_reajuste_resumo: normalize(data.historico_reajuste_resumo),
  status_pagamento: normalize(data.status_pagamento),
  ultima_competencia_paga: normalize(data.ultima_competencia_paga),
  observacoes_financeiras: normalize(data.observacoes_financeiras),
  beneficios: {
    plano_saude: sanitizeHealthBenefit(data.beneficios.plano_saude),
    plano_odontologico: sanitizeHealthBenefit(data.beneficios.plano_odontologico),
    vt: sanitizeBenefit(data.beneficios.vt),
    vr_va: sanitizeBenefit(data.beneficios.vr_va),
  },
});

const toPjRow = (
  pjId: string,
  input: ReturnType<typeof sanitizeInput>,
  actor: string,
  now: string,
  existing?: PjRow
): PjRow => ({
  ...getBenefitSummary(input.beneficios),
  pj_id: pjId,
  nome_completo: input.nome_completo,
  nome_social: input.nome_social,
  cpf: input.cpf,
  data_nascimento: input.data_nascimento,
  email: input.email,
  telefone: input.telefone,
  status_cadastro: input.status_cadastro,
  observacoes_cadastrais: input.observacoes_cadastrais,
  razao_social: input.razao_social,
  nome_fantasia: input.nome_fantasia,
  cnpj: input.cnpj,
  qsa_recebido: String(input.qsa_recebido),
  data_recebimento_qsa: input.data_recebimento_qsa,
  status_documental: input.status_documental,
  municipio_uf_empresa: input.municipio_uf_empresa,
  dados_bancarios: input.dados_bancarios,
  observacoes_contratuais: input.observacoes_contratuais,
  status_vinculo: input.status_vinculo,
  data_inicio: input.data_inicio,
  data_termino_prevista: input.data_termino_prevista,
  data_encerramento_real: input.data_encerramento_real,
  tipo_contrato_categoria: input.tipo_contrato_categoria,
  regime_operacional: input.regime_operacional,
  gestor_responsavel: input.gestor_responsavel,
  area: input.area,
  marca: input.marca,
  unidade: input.unidade,
  centro_custo: input.centro_custo,
  empresa_alocacao: input.empresa_alocacao,
  tipo_prestacao: input.tipo_prestacao,
  jornada_dedicacao: input.jornada_dedicacao,
  valor_mensal_contratado: String(input.valor_mensal_contratado),
  tipo_remuneracao: input.tipo_remuneracao,
  valor_ajuda_custo: String(input.valor_ajuda_custo),
  valor_total_mensal_previsto: String(input.valor_total_mensal_previsto),
  data_base_reajuste: input.data_base_reajuste,
  historico_reajuste_resumo: input.historico_reajuste_resumo,
  status_pagamento: input.status_pagamento,
  ultima_competencia_paga: input.ultima_competencia_paga,
  observacoes_financeiras: input.observacoes_financeiras,
  elegivel_plano_saude: String(input.beneficios.plano_saude.elegivel),
  elegivel_plano_odontologico: String(input.beneficios.plano_odontologico.elegivel),
  elegivel_vt: String(input.beneficios.vt.elegivel),
  elegivel_vr_va: String(input.beneficios.vr_va.elegivel),
  documentacao_pendente: String(input.documentacao_pendente),
  created_at: existing?.created_at ?? now,
  created_by: existing?.created_by ?? actor,
  updated_at: now,
  updated_by: actor,
});

const hydratePj = (row: PjRow): PjListItem => {
  const custoTotalMensal =
    parseNumber(row.valor_total_mensal_previsto) +
    parseNumber(row.custo_beneficios_mensal);
  const percentualBeneficios =
    parseNumber(row.valor_total_mensal_previsto) > 0
      ? (parseNumber(row.custo_beneficios_mensal) /
          parseNumber(row.valor_total_mensal_previsto)) *
        100
      : 0;
  const flagDocumentalPendente =
    parseBoolean(row.documentacao_pendente) || row.status_documental !== "REGULAR";
  const flagSemCentroCusto =
    isActiveStatus(row.status_vinculo) && !normalize(row.centro_custo);
  const flagSemBeneficioConfigurado =
    isActiveStatus(row.status_vinculo) &&
    row.status_beneficio === "NAO_CONCEDIDO" &&
    !normalize(row.beneficios_concedidos_resumo);
  const flagAlocacaoIncompleta =
    isActiveStatus(row.status_vinculo) &&
    [row.marca, row.area, row.gestor_responsavel, row.centro_custo].some(
      (value) => !normalize(value)
    );
  const beneficioAtivoIncompleto =
    row.status_beneficio === "ATIVO" &&
    [row.fornecedor_beneficio, row.data_inclusao_beneficio].some(
      (value) => !normalize(value)
    );
  const semFinanceiroVigente =
    isActiveStatus(row.status_vinculo) && parseNumber(row.valor_mensal_contratado) <= 0;
  const pendencias: string[] = [];

  if (flagDocumentalPendente) pendencias.push("Documentacao pendente");
  if (flagSemCentroCusto || flagAlocacaoIncompleta)
    pendencias.push("Alocacao incompleta");
  if (flagSemBeneficioConfigurado) pendencias.push("Sem beneficio configurado");
  if (beneficioAtivoIncompleto) pendencias.push("Beneficio ativo inconsistente");
  if (semFinanceiroVigente) pendencias.push("Sem valor mensal vigente");

  return {
    ...row,
    custo_total_mensal: custoTotalMensal,
    percentual_beneficios: percentualBeneficios,
    flag_documental_pendente: flagDocumentalPendente,
    flag_sem_centro_custo: flagSemCentroCusto,
    flag_sem_beneficio_configurado: flagSemBeneficioConfigurado,
    flag_inconsistencia:
      beneficioAtivoIncompleto || semFinanceiroVigente || flagAlocacaoIncompleta,
    pendencias,
  };
};

const assertNoDuplicateActiveRegistry = async (
  input: ReturnType<typeof sanitizeInput>,
  pjId?: string
) => {
  const rows = await safeGetRowsCached<PjRow>("pjs");
  const duplicate = rows.find(
    (row) =>
      row.pj_id !== pjId &&
      normalize(row.cpf) === input.cpf &&
      normalize(row.cnpj) === input.cnpj &&
      isActiveStatus(row.status_vinculo)
  );

  if (duplicate) {
    throw new Error("Ja existe um PJ ativo com o mesmo CPF e CNPJ.");
  }
};

const appendFinancialHistory = async (
  pjId: string,
  input: ReturnType<typeof sanitizeInput>,
  actor: string
) => {
  await appendRow("pj_financial_history", {
    pj_financial_history_id: createUuid(),
    pj_id: pjId,
    data_vigencia: input.data_inicio,
    valor_mensal_contratado: input.valor_mensal_contratado,
    valor_ajuda_custo: input.valor_ajuda_custo,
    valor_total_mensal_previsto: input.valor_total_mensal_previsto,
    tipo_remuneracao: input.tipo_remuneracao,
    observacoes: input.historico_reajuste_resumo,
    created_at: getNow(),
    created_by: actor,
  });
};

const appendBenefitHistory = async (
  pjId: string,
  input: ReturnType<typeof sanitizeInput>,
  actor: string
) => {
  for (const [benefitKey, benefit] of getBenefitEntries(input.beneficios)) {
    if (!hasConfiguredBenefitData(benefit)) continue;

    await appendRow("pj_benefits", {
      pj_benefit_id: createUuid(),
      pj_id: pjId,
      beneficio: BENEFIT_FIELD_MAP[benefitKey].label,
      fornecedor: benefit.fornecedor,
      produto_plano: benefit.produto_plano,
      status: benefit.status,
      elegivel: String(benefit.elegivel),
      concedido: String(benefit.status === "ATIVO"),
      data_inclusao: benefit.data_inclusao,
      data_exclusao: benefit.data_exclusao,
      tipo_custeio: benefit.tipo_custeio,
      subsidio_empresa: String(benefit.subsidio_empresa),
      coparticipacao: String(benefit.coparticipacao_aplicavel),
      observacoes: benefit.observacoes_regra,
      created_at: getNow(),
      created_by: actor,
    });
  }

  await appendDependentBenefitHistory(
    pjId,
    "PLANO_SAUDE_DEPENDENTE",
    input.beneficios.plano_saude,
    actor
  );
  await appendDependentBenefitHistory(
    pjId,
    "PLANO_ODONTO_DEPENDENTE",
    input.beneficios.plano_odontologico,
    actor
  );
};

const appendAllocationHistory = async (
  pjId: string,
  input: ReturnType<typeof sanitizeInput>,
  actor: string
) => {
  await appendRow("pj_allocations", {
    pj_allocation_id: createUuid(),
    pj_id: pjId,
    marca: input.marca,
    unidade: input.unidade,
    area: input.area,
    gestor_responsavel: input.gestor_responsavel,
    centro_custo: input.centro_custo,
    empresa_alocacao: input.empresa_alocacao,
    status_vinculo: input.status_vinculo,
    data_inicio: input.data_inicio,
    data_fim: input.data_encerramento_real,
    observacoes: input.tipo_prestacao,
    created_at: getNow(),
    created_by: actor,
  });
};

export const summarizePjs = (rows: PjListItem[]): PjSummary => ({
  total: rows.length,
  ativos: rows.filter((row) => row.status_vinculo === "ATIVO").length,
  pendenciasDocumentais: rows.filter((row) => row.flag_documental_pendente).length,
  alocacaoIncompleta: rows.filter((row) => row.pendencias.includes("Alocacao incompleta"))
    .length,
  semBeneficioConfigurado: rows.filter((row) => row.flag_sem_beneficio_configurado)
    .length,
  custoTotalMensal: rows.reduce((total, row) => total + row.custo_total_mensal, 0),
});

export const listPjs = async ({
  search,
  status_vinculo,
  marca,
  area,
  gestor_responsavel,
  centro_custo,
  status_documental,
  benefit_status,
  limit = 10,
  offset = 0,
}: ListPjsParams) => {
  const rows = await safeGetRowsCached<PjRow>("pjs");
  let result = rows.map(hydratePj);

  if (search) {
    const term = search.toLowerCase();
    result = result.filter((row) =>
      [row.nome_completo, row.cpf, row.cnpj, row.pj_id, row.razao_social]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }
  if (status_vinculo)
    result = result.filter((row) => row.status_vinculo === status_vinculo);
  if (marca) result = result.filter((row) => row.marca === marca);
  if (area) result = result.filter((row) => row.area === area);
  if (gestor_responsavel) {
    result = result.filter((row) => row.gestor_responsavel === gestor_responsavel);
  }
  if (centro_custo) result = result.filter((row) => row.centro_custo === centro_custo);
  if (status_documental) {
    result = result.filter((row) => row.status_documental === status_documental);
  }
  if (benefit_status)
    result = result.filter((row) => row.status_beneficio === benefit_status);

  const total = result.length;
  const start = Math.max(offset, 0);
  const end = start + Math.max(limit, 0);
  return { rows: result.slice(start, end), total, summary: summarizePjs(result) };
};

export const getPjById = async (pjId: string) => {
  try {
    const row = (await findById("pjs", "pj_id", pjId)) as PjRow | null;
    return row ? hydratePj(row) : null;
  } catch (error) {
    if (isMissingSheetError(error)) {
      return null;
    }
    throw error;
  }
};

export const getPjDetailById = async (pjId: string): Promise<PjDetail | null> => {
  const pj = await getPjById(pjId);
  if (!pj) return null;

  const [financialHistory, benefitHistory, allocationHistory, descriptiveHistory] =
    await Promise.all([
      safeGetRowsCached<PjFinancialHistoryRow>("pj_financial_history"),
      safeGetRowsCached<PjBenefitHistoryRow>("pj_benefits"),
      safeGetRowsCached<PjAllocationHistoryRow>("pj_allocations"),
      listPjHealthDescriptiveHistory(pjId),
    ]);

  return {
    pj,
    financialHistory: financialHistory.filter((row) => row.pj_id === pjId),
    benefitHistory: benefitHistory.filter((row) => row.pj_id === pjId),
    allocationHistory: allocationHistory.filter((row) => row.pj_id === pjId),
    descriptiveHistory,
  };
};

export const createPj = async (input: PjInput, createdBy: string) => {
  const data = sanitizeInput(input);
  await assertNoDuplicateActiveRegistry(data);

  const now = getNow();
  const pjId = createUuid();
  const pj = toPjRow(pjId, data, createdBy, now);

  await appendRow("pjs", pj);
  await Promise.all([
    appendFinancialHistory(pjId, data, createdBy),
    appendBenefitHistory(pjId, data, createdBy),
    appendAllocationHistory(pjId, data, createdBy),
    appendAudit("CREATE", pjId, null, pj, createdBy),
  ]);

  return hydratePj(pj);
};

export const updatePj = async (pjId: string, input: PjInput, updatedBy: string) => {
  const existing = (await findById("pjs", "pj_id", pjId)) as PjRow | null;
  if (!existing) {
    throw new Error("PJ nao encontrado.");
  }

  const data = sanitizeInput(input);
  await assertNoDuplicateActiveRegistry(data, pjId);

  const updated = toPjRow(pjId, data, updatedBy, getNow(), existing);
  await updateRowById("pjs", "pj_id", pjId, updated);
  await Promise.all([
    appendFinancialHistory(pjId, data, updatedBy),
    appendBenefitHistory(pjId, data, updatedBy),
    appendAllocationHistory(pjId, data, updatedBy),
    appendAudit("UPDATE", pjId, existing, updated, updatedBy),
  ]);

  return hydratePj(updated);
};
