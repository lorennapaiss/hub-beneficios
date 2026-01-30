# Schema do Google Sheets

Este documento define as abas e colunas mínimas esperadas.

## Abas obrigatórias
- `cards`
- `people`
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
