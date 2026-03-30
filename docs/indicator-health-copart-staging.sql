create table if not exists public.indicator_health_copart_staging (
  id uuid primary key default gen_random_uuid(),
  competence text not null,
  year integer not null,
  month integer not null,
  copart_amount numeric(14,2) not null default 0,
  brand text,
  employee_name text,
  employee_id text,
  cpf text,
  holder_name text,
  holder_cpf text,
  holder_type text,
  role text,
  source_reference_date text,
  created_at timestamptz not null default now()
);

create index if not exists indicator_health_copart_staging_competence_idx
  on public.indicator_health_copart_staging (competence);

create index if not exists indicator_health_copart_staging_brand_idx
  on public.indicator_health_copart_staging (brand);

create index if not exists indicator_health_copart_staging_employee_id_idx
  on public.indicator_health_copart_staging (employee_id);
