import "server-only";

import { createUuid } from "@/lib/uuid";
import type { PjInput } from "@/lib/schemas/pj";
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
};

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

const appendAudit = async (
  action: "CREATE" | "UPDATE",
  pjId: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
  createdBy: string,
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
  beneficios_concedidos_resumo: normalize(data.beneficios_concedidos_resumo),
  fornecedor_beneficio: normalize(data.fornecedor_beneficio),
  produto_plano: normalize(data.produto_plano),
  data_inclusao_beneficio: normalize(data.data_inclusao_beneficio),
  data_exclusao_beneficio: normalize(data.data_exclusao_beneficio),
  tipo_custeio: normalize(data.tipo_custeio),
  status_beneficio: normalize(data.status_beneficio),
  observacoes_regra: normalize(data.observacoes_regra),
});

const toPjRow = (
  pjId: string,
  input: ReturnType<typeof sanitizeInput>,
  actor: string,
  now: string,
  existing?: PjRow,
): PjRow => ({
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
  elegivel_plano_saude: String(input.elegivel_plano_saude),
  elegivel_plano_odontologico: String(input.elegivel_plano_odontologico),
  elegivel_vt: String(input.elegivel_vt),
  elegivel_vr_va: String(input.elegivel_vr_va),
  beneficios_concedidos_resumo: input.beneficios_concedidos_resumo,
  fornecedor_beneficio: input.fornecedor_beneficio,
  produto_plano: input.produto_plano,
  data_inclusao_beneficio: input.data_inclusao_beneficio,
  data_exclusao_beneficio: input.data_exclusao_beneficio,
  tipo_custeio: input.tipo_custeio,
  subsidio_empresa: String(input.subsidio_empresa),
  coparticipacao_aplicavel: String(input.coparticipacao_aplicavel),
  status_beneficio: input.status_beneficio,
  observacoes_regra: input.observacoes_regra,
  custo_beneficios_mensal: String(input.custo_beneficios_mensal),
  documentacao_pendente: String(input.documentacao_pendente),
  created_at: existing?.created_at ?? now,
  created_by: existing?.created_by ?? actor,
  updated_at: now,
  updated_by: actor,
});

const hydratePj = (row: PjRow): PjListItem => {
  const custoTotalMensal =
    parseNumber(row.valor_total_mensal_previsto) + parseNumber(row.custo_beneficios_mensal);
  const percentualBeneficios =
    parseNumber(row.valor_total_mensal_previsto) > 0
      ? (parseNumber(row.custo_beneficios_mensal) / parseNumber(row.valor_total_mensal_previsto)) *
        100
      : 0;
  const flagDocumentalPendente =
    parseBoolean(row.documentacao_pendente) || row.status_documental !== "REGULAR";
  const flagSemCentroCusto = isActiveStatus(row.status_vinculo) && !normalize(row.centro_custo);
  const flagSemBeneficioConfigurado =
    isActiveStatus(row.status_vinculo) &&
    row.status_beneficio === "NAO_CONCEDIDO" &&
    !normalize(row.beneficios_concedidos_resumo);
  const flagAlocacaoIncompleta =
    isActiveStatus(row.status_vinculo) &&
    [row.marca, row.area, row.gestor_responsavel, row.centro_custo].some(
      (value) => !normalize(value),
    );
  const beneficioAtivoIncompleto =
    row.status_beneficio === "ATIVO" &&
    [row.fornecedor_beneficio, row.data_inclusao_beneficio].some((value) => !normalize(value));
  const semFinanceiroVigente =
    isActiveStatus(row.status_vinculo) && parseNumber(row.valor_mensal_contratado) <= 0;
  const pendencias: string[] = [];

  if (flagDocumentalPendente) pendencias.push("Documentacao pendente");
  if (flagSemCentroCusto || flagAlocacaoIncompleta) pendencias.push("Alocacao incompleta");
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
  pjId?: string,
) => {
  const rows = await safeGetRowsCached<PjRow>("pjs");
  const duplicate = rows.find(
    (row) =>
      row.pj_id !== pjId &&
      normalize(row.cpf) === input.cpf &&
      normalize(row.cnpj) === input.cnpj &&
      isActiveStatus(row.status_vinculo),
  );

  if (duplicate) {
    throw new Error("Ja existe um PJ ativo com o mesmo CPF e CNPJ.");
  }
};

const appendFinancialHistory = async (
  pjId: string,
  input: ReturnType<typeof sanitizeInput>,
  actor: string,
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
  actor: string,
) => {
  const benefitFlags = [
    { nome: "PLANO_SAUDE", elegivel: input.elegivel_plano_saude },
    { nome: "PLANO_ODONTO", elegivel: input.elegivel_plano_odontologico },
    { nome: "VT", elegivel: input.elegivel_vt },
    { nome: "VR_VA", elegivel: input.elegivel_vr_va },
  ];

  const activeBenefitName =
    input.beneficios_concedidos_resumo.split(",").map((item) => item.trim()).filter(Boolean)[0] ??
    "CONFIGURACAO_GERAL";

  for (const benefit of benefitFlags) {
    if (!benefit.elegivel && input.status_beneficio === "NAO_CONCEDIDO") continue;
    await appendRow("pj_benefits", {
      pj_benefit_id: createUuid(),
      pj_id: pjId,
      beneficio:
        benefit.nome === "PLANO_SAUDE" && input.status_beneficio === "ATIVO"
          ? activeBenefitName
          : benefit.nome,
      fornecedor: input.fornecedor_beneficio,
      produto_plano: input.produto_plano,
      status: input.status_beneficio,
      elegivel: String(benefit.elegivel),
      concedido: String(input.status_beneficio === "ATIVO"),
      data_inclusao: input.data_inclusao_beneficio,
      data_exclusao: input.data_exclusao_beneficio,
      tipo_custeio: input.tipo_custeio,
      subsidio_empresa: input.subsidio_empresa,
      coparticipacao: String(input.coparticipacao_aplicavel),
      observacoes: input.observacoes_regra,
      created_at: getNow(),
      created_by: actor,
    });
  }
};

const appendAllocationHistory = async (
  pjId: string,
  input: ReturnType<typeof sanitizeInput>,
  actor: string,
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
  alocacaoIncompleta: rows.filter((row) => row.pendencias.includes("Alocacao incompleta")).length,
  semBeneficioConfigurado: rows.filter((row) => row.flag_sem_beneficio_configurado).length,
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
        .includes(term),
    );
  }
  if (status_vinculo) result = result.filter((row) => row.status_vinculo === status_vinculo);
  if (marca) result = result.filter((row) => row.marca === marca);
  if (area) result = result.filter((row) => row.area === area);
  if (gestor_responsavel) {
    result = result.filter((row) => row.gestor_responsavel === gestor_responsavel);
  }
  if (centro_custo) result = result.filter((row) => row.centro_custo === centro_custo);
  if (status_documental) {
    result = result.filter((row) => row.status_documental === status_documental);
  }
  if (benefit_status) result = result.filter((row) => row.status_beneficio === benefit_status);

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

  const [financialHistory, benefitHistory, allocationHistory] = await Promise.all([
    safeGetRowsCached<PjFinancialHistoryRow>("pj_financial_history"),
    safeGetRowsCached<PjBenefitHistoryRow>("pj_benefits"),
    safeGetRowsCached<PjAllocationHistoryRow>("pj_allocations"),
  ]);

  return {
    pj,
    financialHistory: financialHistory.filter((row) => row.pj_id === pjId),
    benefitHistory: benefitHistory.filter((row) => row.pj_id === pjId),
    allocationHistory: allocationHistory.filter((row) => row.pj_id === pjId),
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
