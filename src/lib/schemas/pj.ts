import { z } from "zod";

export const PjStatusEnum = z.enum([
  "EM_ATIVACAO",
  "ATIVO",
  "SUSPENSO",
  "ENCERRADO",
]);

export const PjRegistrationStatusEnum = z.enum([
  "RASCUNHO",
  "PENDENTE",
  "COMPLETO",
]);

export const PjDocumentStatusEnum = z.enum([
  "PENDENTE",
  "EM_ANALISE",
  "REGULAR",
]);

export const PjRemunerationTypeEnum = z.enum(["FIXO", "VARIAVEL", "MISTO"]);

export const PjBenefitStatusEnum = z.enum(["NAO_CONCEDIDO", "ATIVO", "ENCERRADO"]);

export const PjInputSchema = z.object({
  nome_completo: z.string().trim().min(1, "Informe o nome completo."),
  nome_social: z.string().trim().optional(),
  cpf: z
    .string()
    .trim()
    .min(11, "Informe o CPF.")
    .regex(/^[0-9.\-]+$/, "CPF invalido."),
  data_nascimento: z.string().trim().optional(),
  email: z.string().trim().email("Informe um e-mail valido."),
  telefone: z.string().trim().min(8, "Informe o telefone."),
  status_cadastro: PjRegistrationStatusEnum.default("PENDENTE"),
  observacoes_cadastrais: z.string().trim().optional(),
  razao_social: z.string().trim().min(1, "Informe a razao social."),
  nome_fantasia: z.string().trim().optional(),
  cnpj: z
    .string()
    .trim()
    .min(14, "Informe o CNPJ.")
    .regex(/^[0-9./\-]+$/, "CNPJ invalido."),
  qsa_recebido: z.boolean().default(false),
  data_recebimento_qsa: z.string().trim().optional(),
  status_documental: PjDocumentStatusEnum.default("PENDENTE"),
  municipio_uf_empresa: z.string().trim().optional(),
  dados_bancarios: z.string().trim().optional(),
  observacoes_contratuais: z.string().trim().optional(),
  status_vinculo: PjStatusEnum.default("EM_ATIVACAO"),
  data_inicio: z.string().trim().min(1, "Informe a data de inicio."),
  data_termino_prevista: z.string().trim().optional(),
  data_encerramento_real: z.string().trim().optional(),
  tipo_contrato_categoria: z.string().trim().min(1, "Informe o tipo de contrato."),
  regime_operacional: z.string().trim().optional(),
  gestor_responsavel: z.string().trim().min(1, "Informe o gestor responsavel."),
  area: z.string().trim().min(1, "Informe a area."),
  marca: z.string().trim().min(1, "Informe a marca."),
  unidade: z.string().trim().optional(),
  centro_custo: z.string().trim().min(1, "Informe o centro de custo."),
  empresa_alocacao: z.string().trim().optional(),
  tipo_prestacao: z.string().trim().optional(),
  jornada_dedicacao: z.string().trim().optional(),
  valor_mensal_contratado: z.number().min(0, "Informe um valor valido."),
  tipo_remuneracao: PjRemunerationTypeEnum.default("FIXO"),
  valor_ajuda_custo: z.number().min(0).default(0),
  valor_total_mensal_previsto: z.number().min(0, "Informe um valor valido."),
  data_base_reajuste: z.string().trim().optional(),
  historico_reajuste_resumo: z.string().trim().optional(),
  status_pagamento: z.string().trim().optional(),
  ultima_competencia_paga: z.string().trim().optional(),
  observacoes_financeiras: z.string().trim().optional(),
  elegivel_plano_saude: z.boolean().default(false),
  elegivel_plano_odontologico: z.boolean().default(false),
  elegivel_vt: z.boolean().default(false),
  elegivel_vr_va: z.boolean().default(false),
  beneficios_concedidos_resumo: z.string().trim().optional(),
  fornecedor_beneficio: z.string().trim().optional(),
  produto_plano: z.string().trim().optional(),
  data_inclusao_beneficio: z.string().trim().optional(),
  data_exclusao_beneficio: z.string().trim().optional(),
  tipo_custeio: z.string().trim().optional(),
  subsidio_empresa: z.number().min(0).default(0),
  coparticipacao_aplicavel: z.boolean().default(false),
  status_beneficio: PjBenefitStatusEnum.default("NAO_CONCEDIDO"),
  observacoes_regra: z.string().trim().optional(),
  custo_beneficios_mensal: z.number().min(0).default(0),
  documentacao_pendente: z.boolean().default(false),
});

export type PjInput = z.infer<typeof PjInputSchema>;
export type PjFormValues = z.infer<typeof PjInputSchema>;
