# Schema do Google Sheets

Este documento define as abas e colunas mínimas esperadas.

## Abas obrigatórias
- `cards`
- `people`
- `pjs`
- `pj_financial_history`
- `pj_benefits`
- `pj_allocations`
- `loads`
- `allocations`
- `events`
- `attachments`
- `audit_log`

## Colunas por aba

### cards
| coluna | descrição |
| --- | --- |
| card_id | UUID do cartão |
| numero_cartao | número físico do cartão |
| marca | marca/operadora |
| unidade | unidade atual |
| status | status do cartão |
| foto_cartao_url | link da foto |
| observacoes | observações gerais |
| created_at | data de criação |
| created_by | autor do cadastro |
| updated_at | data de atualização |
| updated_by | autor da atualização |

### people
| coluna | descrição |
| --- | --- |
| person_id | UUID da pessoa |
| nome | nome completo |
| chapa_matricula | matrícula |
| marca | marca/operadora |
| unidade | unidade |
| status | status |
| created_at | data de criação |
| created_by | autor do cadastro |
| updated_at | data de atualização |
| updated_by | autor da atualização |

### pjs
| coluna | descrição |
| --- | --- |
| pj_id | UUID interno do profissional PJ |
| nome_completo | nome da pessoa física prestadora |
| cpf | CPF do profissional |
| razao_social | empresa contratada |
| cnpj | CNPJ da empresa contratada |
| status_vinculo | status operacional do vínculo |
| gestor_responsavel | gestor atual |
| area | área de alocação |
| marca | marca atual |
| centro_custo | centro de custo |
| valor_total_mensal_previsto | custo mensal previsto sem benefícios |
| custo_beneficios_mensal | custo mensal de benefícios |
| status_beneficio | status consolidado de benefícios |
| status_documental | status documental |
| documentacao_pendente | flag de pendência documental |
| created_at | data de criação |
| created_by | autor do cadastro |
| updated_at | data de atualização |
| updated_by | autor da atualização |

### pj_financial_history
| coluna | descrição |
| --- | --- |
| pj_financial_history_id | UUID do evento financeiro |
| pj_id | vínculo com a base mestre |
| data_vigencia | início da vigência |
| valor_mensal_contratado | remuneração base |
| valor_ajuda_custo | ajuda de custo |
| valor_total_mensal_previsto | custo previsto |
| tipo_remuneracao | fixo, variavel ou misto |
| observacoes | resumo de reajuste |
| created_at | data de criação |
| created_by | autor do registro |

### pj_benefits
| coluna | descrição |
| --- | --- |
| pj_benefit_id | UUID do registro de benefício |
| pj_id | vínculo com a base mestre |
| beneficio | nome do benefício |
| fornecedor | operadora ou fornecedor |
| produto_plano | plano/produto |
| status | status do benefício |
| elegivel | flag de elegibilidade |
| concedido | flag de concessão |
| data_inclusao | data de inclusão |
| data_exclusao | data de exclusão |
| tipo_custeio | forma de custeio |
| subsidio_empresa | subsídio da empresa |
| coparticipacao | flag de coparticipação |
| observacoes | regra ou contexto |
| created_at | data de criação |
| created_by | autor do registro |

### pj_allocations
| coluna | descrição |
| --- | --- |
| pj_allocation_id | UUID do registro de alocação |
| pj_id | vínculo com a base mestre |
| marca | marca de alocação |
| unidade | unidade |
| area | área |
| gestor_responsavel | gestor |
| centro_custo | centro de custo |
| empresa_alocacao | empresa de alocação |
| status_vinculo | status na data do registro |
| data_inicio | data de início |
| data_fim | data de fim |
| observacoes | contexto da movimentação |
| created_at | data de criação |
| created_by | autor do registro |

### loads
| coluna | descrição |
| --- | --- |
| load_id | UUID da carga |
| card_id | UUID do cartão |
| data_carga | data da carga |
| valor_carga | valor |
| comprovante_url | link do comprovante |
| observacoes | observações |
| created_at | data de criação |
| created_by | autor do registro |

### allocations
| coluna | descrição |
| --- | --- |
| allocation_id | UUID da alocação |
| card_id | UUID do cartão |
| person_id | UUID da pessoa |
| data_inicio | data inicial |
| data_fim | data final |
| status | status |
| motivo | motivo |
| created_at | data de criação |
| created_by | autor do registro |

### events
| coluna | descrição |
| --- | --- |
| event_id | UUID do evento |
| card_id | UUID do cartão |
| event_type | tipo do evento |
| event_date | data do evento |
| payload_json | payload em JSON |
| created_by | autor do evento |

### attachments
| coluna | descrição |
| --- | --- |
| attachment_id | UUID do anexo |
| card_id | UUID do cartão |
| type | tipo |
| url | URL |
| notes | observações |
| created_at | data de criação |
| created_by | autor do registro |

### audit_log
| coluna | descrição |
| --- | --- |
| audit_id | UUID do log |
| entity_type | tipo da entidade |
| entity_id | id da entidade |
| action | ação |
| before_json | JSON antes |
| after_json | JSON depois |
| created_at | data de criação |
| created_by | autor da ação |
