create extension if not exists pgcrypto;

create table if not exists public.indicator_user_brand_access (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  user_email text not null,
  brand_id text,
  brand_code text,
  brand_name text,
  role text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists indicator_user_brand_access_user_email_idx
  on public.indicator_user_brand_access (lower(user_email));

create index if not exists indicator_user_brand_access_brand_name_idx
  on public.indicator_user_brand_access (brand_name);
