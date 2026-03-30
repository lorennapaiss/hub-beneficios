# Proximas planilhas para subir no Supabase

## Ordem recomendada

### Bloco 1: base operacional simples
1. `people`
2. `cards`
3. `loads`
4. `allocations`
5. `events`
6. `attachments`
7. `audit_log`

### Bloco 2: modulo PJ
1. `pjs`
2. `pj_financial_history`
3. `pj_benefits`
4. `pj_allocations`

### Bloco 3: modulo pagamentos
1. `payments`
2. `payment_audit_logs`
3. `payment_reminder_ledger`
4. `payment_config`
5. `faturas_contratos`
6. `faturas_execucoes`

## Qual SQL usar

- Para `people/cards/loads/allocations/events/attachments/audit_log/pjs/pj_*`:
  usar [supabase-operational-core.sql](/Users/loren/OneDrive/Documentos/Aplicações%20WEB/hub-beneficios/docs/supabase-operational-core.sql)

- Para `payments` e tabelas auxiliares:
  usar [supabase-payments.sql](/Users/loren/OneDrive/Documentos/Aplicações%20WEB/hub-beneficios/docs/supabase-payments.sql)

## Como fazer

1. Abrir `SQL Editor` no Supabase.
2. Executar o SQL do bloco correspondente.
3. Exportar cada aba do Google Sheets em CSV.
4. Abrir `Table Editor`.
5. Importar cada CSV na tabela com o mesmo nome.

## Ordem mais saudavel para voce

Como voce esta fazendo a migracao manual, a melhor sequencia agora e:

1. fechar `people`
2. fechar `cards` com `loads/allocations/events/attachments/audit_log`
3. fechar `pjs` com seus historicos
4. deixar `payments` por ultimo

`payments` fica por ultimo porque ele nao e so cadastro: ele tambem depende de anexos, status, lembretes e configuracoes.
