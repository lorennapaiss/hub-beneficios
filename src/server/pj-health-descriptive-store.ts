import "server-only";

import { getRowsCached } from "@/server/sheets";

export const PJ_DESCRITIVO_CONFIG_SHEET = "pj_descritivo_config";
export const PJ_DESCRITIVO_ENTRY_SHEET = "pj_descritivo_itens";
export const PJ_DESCRITIVO_HISTORY_SHEET = "pj_descritivo_geracoes";

export type PjHealthDescriptiveConfigRow = {
  config_id: string;
  razao_social_emissora: string;
  cnpj_emissora: string;
  endereco_emissora: string;
  cep_emissora: string;
  texto_introdutorio: string;
  texto_observacoes: string;
  politica_geracao_valor_zero: string;
  formato_competencia: string;
  formato_moeda: string;
  nome_arquivo: string;
  template_visual: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
};

export type PjHealthDescriptiveEntryRow = {
  pj_descritivo_item_id: string;
  pj_id: string;
  competencia: string;
  beneficiario_nome: string;
  beneficiario_tipo: string;
  dependente_vinculo: string;
  operadora: string;
  produto_plano: string;
  beneficio_status: string;
  regra_subsidio: string;
  subsidio_tipo: string;
  subsidio_valor: string;
  data_inclusao: string;
  data_exclusao: string;
  mensalidade: string;
  coparticipacao: string;
  total_consolidado_competencia: string;
  observacoes: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
};

export type PjHealthDescriptiveHistoryRow = {
  pj_descritivo_geracao_id: string;
  pj_id: string;
  competencia: string;
  status: string;
  versao: string;
  total_beneficiarios: string;
  total_plano: string;
  total_subsidio: string;
  total_coparticipacao: string;
  total_devido: string;
  arquivo_nome: string;
  snapshot_json: string;
  inconsistencias_json: string;
  generated_at: string;
  generated_by: string;
};

export const listPjHealthDescriptiveHistory = async (pjId: string) => {
  try {
    const rows = (await getRowsCached(PJ_DESCRITIVO_HISTORY_SHEET)) as PjHealthDescriptiveHistoryRow[];
    return rows
      .filter((row) => row.pj_id === pjId)
      .sort((a, b) => (a.generated_at < b.generated_at ? 1 : -1));
  } catch {
    return [];
  }
};
