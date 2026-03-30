# Migracao Para Supabase

Projeto Supabase alvo:
- Project id: `jvynxlyynhumhjfwfwuz`
- URL: `https://jvynxlyynhumhjfwfwuz.supabase.co`

## Etapa 1
- Adicionar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`
- Usar o client server-side em `src/server/supabase.ts`

## Etapa 2
- Migrar `user_brand_access` para tabela `indicator_user_brand_access`
- Ajustar `src/server/indicators/access.ts` para consultar Supabase
- Importar a aba atual com `POST /api/admin/indicators/access/import-from-sheets`
- Para acesso global manual, use `brand_name=ALL`

Schema inicial sugerido:

```sql
create table if not exists public.indicator_user_brand_access (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  brand_code text,
  brand_name text,
  role text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists indicator_user_brand_access_user_email_idx
  on public.indicator_user_brand_access (lower(user_email));
```

## Etapa 3
- Criar tabelas staging para indicadores:
  - `indicator_health_staging`
  - `indicator_health_copart_staging`
  - `indicator_dental_staging`
  - `indicator_transport_staging`
  - `indicator_meal_staging`

## Etapa 4
- Popular staging manualmente por CSV ou importador interno
- Validar competencias no banco antes de trocar o dashboard

## Etapa 5
- Trocar `src/server/indicators/dashboard.ts` para ler Supabase em vez de Google Sheets
