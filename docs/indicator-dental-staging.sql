create table if not exists public.indicator_dental_staging (
  id uuid primary key default gen_random_uuid(),
  competence text not null,
  year integer not null,
  month integer not null,
  amount numeric(14,2) not null default 0,
  operator text,
  unit text,
  branch text,
  contract text,
  company text,
  beneficiary_number text,
  employee_name text,
  employee_id text,
  matricula text,
  cpf text,
  plan text,
  holder_type text,
  holder_name text,
  holder_cpf text,
  age integer,
  kinship text,
  inclusion_date text,
  description text,
  source_file text,
  source_month_label text,
  source_role text,
  role text,
  source_last_month numeric(14,2) not null default 0,
  brand text,
  brand_totvs text,
  unit_totvs text,
  created_at timestamptz not null default now()
);

create index if not exists indicator_dental_staging_competence_idx
  on public.indicator_dental_staging (competence);

create index if not exists indicator_dental_staging_brand_idx
  on public.indicator_dental_staging (brand);

create index if not exists indicator_dental_staging_employee_idx
  on public.indicator_dental_staging (employee_id);
