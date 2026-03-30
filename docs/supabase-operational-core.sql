create table if not exists public.people (
  person_id text primary key,
  nome text not null default '',
  chapa_matricula text not null default '',
  marca text not null default '',
  unidade text not null default '',
  status text not null default '',
  created_at text not null default '',
  created_by text not null default '',
  updated_at text not null default '',
  updated_by text not null default ''
);

create table if not exists public.cards (
  card_id text primary key,
  numero_cartao text not null default '',
  marca text not null default '',
  unidade text not null default '',
  status text not null default '',
  foto_cartao_url text not null default '',
  observacoes text not null default '',
  created_at text not null default '',
  created_by text not null default '',
  updated_at text not null default '',
  updated_by text not null default ''
);

create table if not exists public.loads (
  load_id text primary key,
  card_id text not null default '',
  data_carga text not null default '',
  valor_carga text not null default '',
  comprovante_url text not null default '',
  observacoes text not null default '',
  created_at text not null default '',
  created_by text not null default ''
);

create table if not exists public.allocations (
  allocation_id text primary key,
  card_id text not null default '',
  person_id text not null default '',
  data_inicio text not null default '',
  data_fim text not null default '',
  status text not null default '',
  motivo text not null default '',
  created_at text not null default '',
  created_by text not null default ''
);

create table if not exists public.events (
  event_id text primary key,
  card_id text not null default '',
  event_type text not null default '',
  event_date text not null default '',
  payload_json text not null default '',
  created_by text not null default ''
);

create table if not exists public.attachments (
  attachment_id text primary key,
  card_id text not null default '',
  type text not null default '',
  url text not null default '',
  notes text not null default '',
  created_at text not null default '',
  created_by text not null default ''
);

create table if not exists public.audit_log (
  audit_id text primary key,
  entity_type text not null default '',
  entity_id text not null default '',
  action text not null default '',
  before_json text not null default '',
  after_json text not null default '',
  created_at text not null default '',
  created_by text not null default ''
);

create table if not exists public.pjs (
  pj_id text primary key,
  nome_completo text not null default '',
  nome_social text not null default '',
  cpf text not null default '',
  data_nascimento text not null default '',
  email text not null default '',
  telefone text not null default '',
  status_cadastro text not null default '',
  observacoes_cadastrais text not null default '',
  razao_social text not null default '',
  nome_fantasia text not null default '',
  cnpj text not null default '',
  qsa_recebido text not null default '',
  data_recebimento_qsa text not null default '',
  status_documental text not null default '',
  municipio_uf_empresa text not null default '',
  dados_bancarios text not null default '',
  observacoes_contratuais text not null default '',
  status_vinculo text not null default '',
  data_inicio text not null default '',
  data_termino_prevista text not null default '',
  data_encerramento_real text not null default '',
  tipo_contrato_categoria text not null default '',
  regime_operacional text not null default '',
  gestor_responsavel text not null default '',
  area text not null default '',
  marca text not null default '',
  unidade text not null default '',
  centro_custo text not null default '',
  empresa_alocacao text not null default '',
  tipo_prestacao text not null default '',
  jornada_dedicacao text not null default '',
  valor_mensal_contratado text not null default '',
  tipo_remuneracao text not null default '',
  valor_ajuda_custo text not null default '',
  valor_total_mensal_previsto text not null default '',
  data_base_reajuste text not null default '',
  historico_reajuste_resumo text not null default '',
  status_pagamento text not null default '',
  ultima_competencia_paga text not null default '',
  observacoes_financeiras text not null default '',
  elegivel_plano_saude text not null default '',
  elegivel_plano_odontologico text not null default '',
  elegivel_vt text not null default '',
  elegivel_vr_va text not null default '',
  beneficios_concedidos_resumo text not null default '',
  fornecedor_beneficio text not null default '',
  produto_plano text not null default '',
  data_inclusao_beneficio text not null default '',
  data_exclusao_beneficio text not null default '',
  tipo_custeio text not null default '',
  subsidio_empresa text not null default '',
  coparticipacao_aplicavel text not null default '',
  status_beneficio text not null default '',
  observacoes_regra text not null default '',
  custo_beneficios_mensal text not null default '',
  documentacao_pendente text not null default '',
  created_at text not null default '',
  created_by text not null default '',
  updated_at text not null default '',
  updated_by text not null default ''
);

create table if not exists public.pj_financial_history (
  pj_financial_history_id text primary key,
  pj_id text not null default '',
  data_vigencia text not null default '',
  valor_mensal_contratado text not null default '',
  valor_ajuda_custo text not null default '',
  valor_total_mensal_previsto text not null default '',
  tipo_remuneracao text not null default '',
  observacoes text not null default '',
  created_at text not null default '',
  created_by text not null default ''
);

create table if not exists public.pj_benefits (
  pj_benefit_id text primary key,
  pj_id text not null default '',
  beneficio text not null default '',
  fornecedor text not null default '',
  produto_plano text not null default '',
  status text not null default '',
  elegivel text not null default '',
  concedido text not null default '',
  data_inclusao text not null default '',
  data_exclusao text not null default '',
  tipo_custeio text not null default '',
  subsidio_empresa text not null default '',
  coparticipacao text not null default '',
  observacoes text not null default '',
  created_at text not null default '',
  created_by text not null default ''
);

create table if not exists public.pj_allocations (
  pj_allocation_id text primary key,
  pj_id text not null default '',
  marca text not null default '',
  unidade text not null default '',
  area text not null default '',
  gestor_responsavel text not null default '',
  centro_custo text not null default '',
  empresa_alocacao text not null default '',
  status_vinculo text not null default '',
  data_inicio text not null default '',
  data_fim text not null default '',
  observacoes text not null default '',
  created_at text not null default '',
  created_by text not null default ''
);

create index if not exists people_marca_idx on public.people (marca);
create index if not exists cards_marca_idx on public.cards (marca);
create index if not exists loads_card_id_idx on public.loads (card_id);
create index if not exists allocations_card_id_idx on public.allocations (card_id);
create index if not exists allocations_person_id_idx on public.allocations (person_id);
create index if not exists events_card_id_idx on public.events (card_id);
create index if not exists attachments_card_id_idx on public.attachments (card_id);
create index if not exists audit_log_entity_idx on public.audit_log (entity_type, entity_id);
create index if not exists pjs_marca_idx on public.pjs (marca);
create index if not exists pj_financial_history_pj_idx on public.pj_financial_history (pj_id);
create index if not exists pj_benefits_pj_idx on public.pj_benefits (pj_id);
create index if not exists pj_allocations_pj_idx on public.pj_allocations (pj_id);
