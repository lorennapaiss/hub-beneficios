create table if not exists public.indicator_transport_staging (
  id uuid primary key default gen_random_uuid(),
  competence text not null,
  year integer not null,
  month integer not null,
  amount numeric(14,2) not null default 0,
  requested_amount numeric(14,2) not null default 0,
  accumulated_balance numeric(14,2) not null default 0,
  economy_amount numeric(14,2) not null default 0,
  has_economy boolean not null default false,
  employee_id text,
  matricula text,
  cpf text,
  employee_name text,
  brand text,
  role text,
  cost_center text,
  provider text,
  source_month_name text,
  source_last_month numeric(14,2),
  created_at timestamptz not null default now()
);

create index if not exists indicator_transport_staging_competence_idx
  on public.indicator_transport_staging (competence);

create index if not exists indicator_transport_staging_brand_idx
  on public.indicator_transport_staging (brand);

create index if not exists indicator_transport_staging_employee_id_idx
  on public.indicator_transport_staging (employee_id);
