export type ProcessingStatus =
  | "OK"
  | "OK_MANUAL"
  | "NAO_ENCONTRADO"
  | "AMBIGUO"
  | "INELEGIVEL"
  | "INVALIDO";

export type CopayOwnerType = "TITULAR" | "DEPENDENTE";

export type CopayOperator = "UNIMED" | "SULAMERICA" | "AMIL";

export type CopayDateFormat = "DDMMAAAA" | "DD/MM/AAAA";

export type Candidate = {
  chapa: string;
  nome: string;
  cargo: string;
  situacao: string;
  similarity: number;
  is_elegivel: boolean;
  motivos_inelegibilidade: string[];
};

export type Collaborator = {
  chapa: string;
  nome_raw: string;
  nome_norm: string;
  situacao_raw: string;
  tipo_funcionario_raw: string;
  cargo_raw: string;
  salario: number;
  is_ativo: boolean;
  is_autonomo: boolean;
  is_elegivel: boolean;
  motivos_inelegibilidade: string[];
};

export type CopayRow = {
  id: string;
  nome_titular_raw: string;
  nome_titular_norm: string;
  nome_beneficiario_raw: string;
  nome_beneficiario_norm: string;
  valor_copay: number;
  sinal: "+" | "-" | null;
  mes_referencia_raw: string;
  status: ProcessingStatus;
  chapa_resolvida?: string;
  titular_ou_dependente: CopayOwnerType;
  codigo_evento: string;
  motivo?: string;
  match_candidates: Candidate[];
  info_colaborador?: {
    nome: string;
    cargo: string;
    situacao: string;
  };
  source_row_number: number;
};

export type ProcessingSummary = {
  total: number;
  ok: number;
  ok_manual: number;
  pendencias: number;
  inelegiveis: number;
  invalidos: number;
  nao_encontrados: number;
  ambiguos: number;
  aprovados: number;
  valor_total_aprovado: number;
};

export type ProcessingResult = {
  collaborators: Collaborator[];
  rows: CopayRow[];
  summary: ProcessingSummary;
  warnings: string[];
};

export type CopayConfig = {
  competencia: string;
  operadora: CopayOperator;
  formato_data: CopayDateFormat;
  similarity_threshold: number;
};

export type CopayFilterState = {
  search: string;
  status: "TODOS" | ProcessingStatus;
  tipo: "TODOS" | CopayOwnerType;
  sortBy: "status" | "nome" | "valor";
};
