create table if not exists public.indicator_health_copart_discounts_staging (
  id uuid primary key default gen_random_uuid(),
  competence text not null,
  year integer not null,
  month integer not null,
  discount_amount numeric(14,2) not null default 0,
  company_code text,
  company_name text,
  branch_code text,
  branch_name text,
  section_code text,
  employee_id text,
  employee_name text,
  cpf text,
  role_code text,
  role_name text,
  event_type text,
  period_number integer,
  dependents_count integer,
  description text,
  brand text,
  unit text,
  created_at timestamptz not null default now()
);

create index if not exists indicator_health_copart_discounts_competence_idx
  on public.indicator_health_copart_discounts_staging (competence);

create index if not exists indicator_health_copart_discounts_brand_idx
  on public.indicator_health_copart_discounts_staging (brand);

create index if not exists indicator_health_copart_discounts_employee_idx
  on public.indicator_health_copart_discounts_staging (employee_id);
