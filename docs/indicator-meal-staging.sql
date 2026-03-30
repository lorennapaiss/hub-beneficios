create table if not exists public.indicator_meal_staging (
  id uuid primary key default gen_random_uuid(),
  competence text not null,
  year integer not null,
  month integer not null,
  amount numeric(14,2) not null default 0,
  employee_id text,
  matricula text,
  employee_name text,
  cpf text,
  cpf_normalized text,
  brand text,
  role text,
  transaction_type text,
  benefit_name text,
  is_last_month boolean not null default false,
  source_reference_date text,
  created_at timestamptz not null default now()
);

create index if not exists indicator_meal_staging_competence_idx
  on public.indicator_meal_staging (competence);

create index if not exists indicator_meal_staging_brand_idx
  on public.indicator_meal_staging (brand);

create index if not exists indicator_meal_staging_employee_idx
  on public.indicator_meal_staging (employee_id);
