# Manual de Preenchimento de PJs

Este manual explica como preencher o cadastro de PJs no Hub de Beneficios, tanto pela tela quanto por importacao CSV.

## Objetivo

O cadastro de PJ concentra:
- dados cadastrais do profissional;
- dados da empresa contratada;
- dados de vinculo e custo;
- beneficios configurados por tipo;
- dependentes do plano de saude;
- base para geracao do descritivo de desconto.

## Preenchimento Pela Tela

O caminho principal e:
- acessar `/pjs`;
- clicar em `Novo PJ`;
- preencher as abas `Cadastro`, `Empresa`, `Vinculo` e `Beneficios`.

### Aba Cadastro

Campos principais:
- `Nome completo`: nome do profissional PJ.
- `CPF`: CPF da pessoa fisica vinculada ao contrato.
- `E-mail`: e-mail de contato.
- `Telefone`: telefone principal.
- `Status do cadastro`: use `PENDENTE`, `COMPLETO` ou `RASCUNHO`.
- `Status documental`: use `PENDENTE`, `EM_ANALISE` ou `REGULAR`.

Boas praticas:
- preencher CPF e telefone sem texto adicional;
- usar e-mail valido;
- marcar `Documentacao pendente` apenas quando realmente existir pendencia operacional.

### Aba Empresa

Campos principais:
- `Razao social`: nome juridico da empresa contratada.
- `Nome fantasia`: opcional.
- `CNPJ`: CNPJ da empresa PJ.
- `Municipio / UF`: cidade e estado da empresa.
- `Dados bancarios`: informacoes de pagamento, quando necessario.
- `QSA recebido`: marque quando o documento societario foi entregue.

Boas praticas:
- preencher CNPJ sem observacoes misturadas;
- usar `Observacoes contratuais` para contexto que nao cabe em campo estruturado.

### Aba Vinculo

Campos principais:
- `Status do vinculo`: `EM_ATIVACAO`, `ATIVO`, `SUSPENSO` ou `ENCERRADO`.
- `Data de inicio`: obrigatoria.
- `Tipo de contrato`: categoria do contrato.
- `Gestor responsavel`, `Area`, `Marca`, `Centro de custo`: fundamentais para operacao.
- `Valor mensal contratado`, `Ajuda de custo`, `Valor total mensal previsto`: base de custo.

Boas praticas:
- manter `Centro de custo` preenchido para evitar pendencia;
- garantir que `Valor total mensal previsto` reflita a composicao financeira vigente.

### Aba Beneficios

Cada beneficio agora e preenchido separadamente:
- `Plano de saude`
- `Plano odontologico`
- `Vale transporte`
- `VR / VA`

Cada bloco possui:
- `Elegivel`
- `Status do beneficio`
- `Fornecedor`
- `Produto / plano`
- `Tipo de custeio`
- `Data de inclusao`
- `Data de exclusao`
- `Subsidio empresa`
- `Custo mensal`
- `Coparticipacao aplicavel`
- `Observacoes de regra`

### Plano de Saude Com Dependentes

No bloco `Plano de saude`, existe a secao `Dependentes`.

Para cada dependente, preencher:
- `Nome`
- `Parentesco`
- `Data de inclusao`
- `Data de exclusao`
- `Subsidio empresa`
- `Custo mensal`
- `Coparticipacao aplicavel`
- `Observacoes`

Quando usar:
- incluir um dependente por registro;
- usar parentesco claro, por exemplo `Filho`, `Filha`, `Conjuge`;
- remover o dependente da tela quando ele nao fizer mais parte do plano.

## Como O Sistema Interpreta Beneficios

Regras praticas:
- um beneficio so entra como configurado quando houver elegibilidade, status diferente de `NAO_CONCEDIDO` ou algum dado financeiro/cadastral relevante;
- o custo total de beneficios considera os custos dos beneficios e, no plano de saude, tambem os dependentes;
- dependentes do plano de saude sao gravados separadamente no historico de beneficios.

## Importacao CSV

O modulo de PJs tem importacao CSV na propria tela `/pjs`.

Fluxo:
1. clicar em `Importar CSV`;
2. baixar o template;
3. preencher o arquivo;
4. enviar o CSV;
5. revisar o relatorio de linhas importadas e linhas com erro.

### Template

Baixe o template oficial em:
- `GET /api/pjs/import/template`

Esse template ja vem com os headers esperados.

### Regras Gerais Do CSV

- a primeira linha deve conter os headers exatos do template;
- cada linha representa um PJ;
- valores booleanos aceitos: `true`, `1`, `sim`, `yes`, `y`;
- valores numericos podem usar `1234.56` ou `1.234,56`;
- datas devem seguir o mesmo padrao usado na aplicacao, preferencialmente `YYYY-MM-DD`.

### Colunas Mais Importantes

Cadastro e empresa:
- `nome_completo`
- `cpf`
- `email`
- `telefone`
- `razao_social`
- `cnpj`

Vinculo:
- `status_vinculo`
- `data_inicio`
- `tipo_contrato_categoria`
- `gestor_responsavel`
- `area`
- `marca`
- `centro_custo`

Financeiro:
- `valor_mensal_contratado`
- `valor_ajuda_custo`
- `valor_total_mensal_previsto`

Beneficios:
- `beneficios.plano_saude.elegivel`
- `beneficios.plano_saude.status`
- `beneficios.plano_saude.fornecedor`
- `beneficios.plano_saude.produto_plano`
- `beneficios.plano_saude.subsidio_empresa`
- `beneficios.plano_saude.custo_mensal`

Mesma logica para:
- `beneficios.plano_odontologico.*`
- `beneficios.vt.*`
- `beneficios.vr_va.*`

### Dependentes No CSV

Dependentes do plano de saude devem ser enviados na coluna:
- `beneficios.plano_saude.dependentes_json`

Formato esperado:
```json
[
  {
    "nome": "Maria",
    "parentesco": "Filha",
    "data_inclusao": "2026-03-01",
    "data_exclusao": "",
    "subsidio_empresa": 100,
    "custo_mensal": 350,
    "coparticipacao_aplicavel": true,
    "observacoes": "Dependente ativo"
  }
]
```

Regras:
- deve ser um JSON array valido;
- cada objeto representa um dependente;
- se nao houver dependentes, deixar vazio;
- nao misturar texto livre fora do JSON.

### Erros Comuns Na Importacao

Erros comuns:
- header alterado manualmente;
- CPF ou CNPJ ausente;
- e-mail invalido;
- `status_vinculo` fora dos valores suportados;
- JSON invalido em `beneficios.plano_saude.dependentes_json`;
- PJ ativo duplicado com mesmo CPF e CNPJ.

## Relacao Com O Descritivo De Desconto

O cadastro do PJ e a configuracao dos beneficios nao geram automaticamente os itens mensais do descritivo.

Para o descritivo funcionar, ainda e necessario preencher:
- `pj_descritivo_config`
- `pj_descritivo_itens`

Na aba `pj_descritivo_itens`, cada beneficiario deve ter sua propria linha:
- titular;
- cada dependente do plano de saude.

## Recomendacao Operacional

Para poucos registros:
- usar preenchimento pela tela.

Para carga inicial ou grandes volumes:
- usar importacao CSV com template;
- validar primeiro 1 ou 2 registros;
- depois importar o lote completo.
