create table if not exists public.payment_config (
  id text primary key,
  allowed_domains text not null default '',
  allowed_emails text not null default '',
  admin_emails text not null default '',
  google_sheets_id text not null default '',
  google_drive_folder_id text not null default '',
  root_drive_folder_id text not null default '',
  team_emails text not null default '',
  reminder_days_before integer not null default 3,
  reminder_daily_hour integer not null default 9,
  reminder_d3_enabled boolean not null default true,
  reminder_d1_enabled boolean not null default true,
  reminder_d0_enabled boolean not null default true,
  reminder_overdue_enabled boolean not null default true,
  reminder_overdue_every_days integer not null default 1,
  timezone text not null default 'America/Sao_Paulo',
  last_reminder_run_at text not null default '',
  faturas_sulamerica_base_folder_id text not null default '',
  competencia_folder_pattern text not null default 'YYYY-MM'
);

create table if not exists public.payments (
  id text primary key,
  category text not null default '',
  brand text not null default '',
  provider text not null default '',
  provider_custom text not null default '',
  subtype text not null default '',
  competence text not null default '',
  ticket_number text not null default '',
  ticket_sent_date text not null default '',
  due_date text not null default '',
  amount numeric(14,2),
  status text not null default '',
  owner_name text not null default '',
  owner_email text not null default '',
  drive_file_id text not null default '',
  drive_link text not null default '',
  drive_filename text not null default '',
  created_at text not null default '',
  updated_at text not null default '',
  paid_at text not null default '',
  paid_by text not null default '',
  notes text not null default ''
);

create table if not exists public.payment_audit_logs (
  id text primary key,
  entity_type text not null default '',
  entity_id text not null default '',
  action text not null default '',
  before text not null default '',
  after text not null default '',
  actor_email text not null default '',
  actor_role text not null default '',
  created_at text not null default '',
  metadata text not null default ''
);

create table if not exists public.payment_reminder_ledger (
  id text primary key,
  payment_id text not null default '',
  due_date text not null default '',
  status_at_run text not null default '',
  reminder_type text not null default '',
  sent_to text not null default '',
  sent_at text not null default '',
  run_id text not null default '',
  result text not null default '',
  error text not null default ''
);

create table if not exists public.faturas_contratos (
  competencia text not null default '',
  operadora text not null default '',
  contrato_codigo text not null default '',
  empresa_nome text not null default '',
  vidas_ativas integer not null default 0,
  custo_total numeric(14,2) not null default 0,
  custo_por_contrato numeric(14,2) not null default 0,
  file_id text not null default '',
  modified_time text not null default '',
  processed_at text not null default '',
  status text not null default '',
  error_message text not null default ''
);

create table if not exists public.faturas_execucoes (
  competencia text not null default '',
  processed_at text not null default '',
  actor_email text not null default '',
  actor_name text not null default '',
  status text not null default '',
  duration_ms integer not null default 0,
  contratos_ok integer not null default 0,
  contratos_erro integer not null default 0,
  total_vidas integer not null default 0,
  total_custo numeric(14,2) not null default 0
);

create index if not exists payments_brand_idx on public.payments (brand);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_competence_idx on public.payments (competence);
create index if not exists payment_audit_entity_idx on public.payment_audit_logs (entity_type, entity_id);
create index if not exists payment_reminder_payment_idx on public.payment_reminder_ledger (payment_id);
create index if not exists faturas_contratos_competencia_idx on public.faturas_contratos (competencia);
create index if not exists faturas_execucoes_competencia_idx on public.faturas_execucoes (competencia);
