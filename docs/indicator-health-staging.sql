create table if not exists public.indicator_health_staging (
  id uuid primary key default gen_random_uuid(),
  competence text not null,
  year integer not null,
  month integer not null,
  premium_amount numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  operator text,
  brand text,
  source_plan_code text,
  source_plan_name text,
  plan_type text,
  employee_name text,
  cpf text,
  employee_id text,
  birth_date text,
  age integer,
  kinship text,
  holder_type text,
  holder_name text,
  holder_cpf text,
  key_value text,
  role text,
  source_role text,
  status text,
  created_at timestamptz not null default now()
);

create index if not exists indicator_health_staging_competence_idx
  on public.indicator_health_staging (competence);

create index if not exists indicator_health_staging_brand_idx
  on public.indicator_health_staging (brand);

create index if not exists indicator_health_staging_employee_id_idx
  on public.indicator_health_staging (employee_id);
