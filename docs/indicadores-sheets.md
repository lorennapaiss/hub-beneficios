# Indicadores de Beneficios (Google Sheets)

O modulo de indicadores possui 4 abas no sistema (uma por beneficio):

- Plano de Saude
- Plano Odontologico
- Vale Transporte
- Vale Refeicao

Cada aba pode apontar para uma planilha diferente.

## Variaveis de ambiente

ID geral (fallback):

- `INDICATORS_SHEETS_ID`

ID por beneficio (prioridade maior):

- `INDICATORS_HEALTH_SHEETS_ID`
- `INDICATORS_DENTAL_SHEETS_ID`
- `INDICATORS_TRANSPORT_SHEETS_ID`
- `INDICATORS_MEAL_SHEETS_ID`

Nome da aba por beneficio:

- `INDICATORS_HEALTH_SHEET_NAME`
- `INDICATORS_DENTAL_SHEET_NAME`
- `INDICATORS_TRANSPORT_SHEET_NAME`
- `INDICATORS_MEAL_SHEET_NAME`

## Colunas aceitas pelo parser

Colunas genericas:

- Competencia: `competencia`, `referencia`, `periodo`, `mes`, `data`, `ultimo_mes`
- Valor: `valor`, `valor_total`, `custo`, `custo_total`, `total`, `amount`
- Vidas: `vidas`, `qtd_vidas`, `colaboradores`, `headcount`
- Centro de custo: `marca`, `centro_custo`, `cost_center`, `cc`, `unidade`, `cargo_depara`
- Fornecedor: `beneficio_depara`, `beneficio`, `fornecedor`, `operadora`, `empresa`

## Layout especifico suportado para VT

Para a aba `Base Vale Transporte`, este layout e suportado diretamente:

- `VLR. FINAL PEDIDO` (prioridade para custo)
- `MÊS` / `MÊS Nº` + `Ano` (competencia)
- `MATRÍCULA` (fallback para headcount = 1 por linha)
- `MARCA` (centro de custo)
- `BENEFÍCIO DEPARA` ou `BENEFÍCIO` (fornecedor/tipo)

## Formatos recomendados

- Competencia: `YYYY-MM`
- Valor: `12345.67` ou `12.345,67`
- Mes: numero (`2`) ou nome (`Fevereiro`)

## O que cada aba do dashboard mostra

- Total da competencia
- Variacao vs mes anterior
- Vidas/colaboradores e custo medio
- Evolucao mensal (ultimos 6 meses)
- Top centros de custo
- Top fornecedores
