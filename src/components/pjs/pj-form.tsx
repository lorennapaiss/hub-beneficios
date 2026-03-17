"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PjBenefitStatusEnum,
  PjDocumentStatusEnum,
  PjInputSchema,
  PjRegistrationStatusEnum,
  PjRemunerationTypeEnum,
  PjStatusEnum,
  type PjFormValues,
} from "@/lib/schemas/pj";

type PjFormProps = {
  mode: "create" | "edit";
  pjId?: string;
  initialValues?: Partial<PjFormValues>;
};

const defaultValues: PjFormValues = {
  nome_completo: "",
  nome_social: "",
  cpf: "",
  data_nascimento: "",
  email: "",
  telefone: "",
  status_cadastro: "PENDENTE",
  observacoes_cadastrais: "",
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  qsa_recebido: false,
  data_recebimento_qsa: "",
  status_documental: "PENDENTE",
  municipio_uf_empresa: "",
  dados_bancarios: "",
  observacoes_contratuais: "",
  status_vinculo: "EM_ATIVACAO",
  data_inicio: "",
  data_termino_prevista: "",
  data_encerramento_real: "",
  tipo_contrato_categoria: "",
  regime_operacional: "",
  gestor_responsavel: "",
  area: "",
  marca: "",
  unidade: "",
  centro_custo: "",
  empresa_alocacao: "",
  tipo_prestacao: "",
  jornada_dedicacao: "",
  valor_mensal_contratado: 0,
  tipo_remuneracao: "FIXO",
  valor_ajuda_custo: 0,
  valor_total_mensal_previsto: 0,
  data_base_reajuste: "",
  historico_reajuste_resumo: "",
  status_pagamento: "",
  ultima_competencia_paga: "",
  observacoes_financeiras: "",
  elegivel_plano_saude: false,
  elegivel_plano_odontologico: false,
  elegivel_vt: false,
  elegivel_vr_va: false,
  beneficios_concedidos_resumo: "",
  fornecedor_beneficio: "",
  produto_plano: "",
  data_inclusao_beneficio: "",
  data_exclusao_beneficio: "",
  tipo_custeio: "",
  subsidio_empresa: 0,
  coparticipacao_aplicavel: false,
  status_beneficio: "NAO_CONCEDIDO",
  observacoes_regra: "",
  custo_beneficios_mensal: 0,
  documentacao_pendente: false,
};

const inputClassName =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className ?? "space-y-2 text-sm font-medium text-foreground"}>
      <span>{label}</span>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

export function PjForm({ mode, pjId, initialValues }: PjFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PjFormValues>({
    resolver: zodResolver(PjInputSchema) as Resolver<PjFormValues>,
    defaultValues: { ...defaultValues, ...initialValues },
  });

  const onSubmit = async (values: PjFormValues) => {
    setServerError(null);
    const endpoint = mode === "create" ? "/api/pjs" : `/api/pjs/${pjId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const payload = await response.json();
    if (!response.ok) {
      setServerError(payload.error ?? "Erro ao salvar PJ.");
      return;
    }

    const targetId = payload.data?.pj_id ?? pjId;
    router.push(targetId ? `/pjs/${targetId}` : "/pjs");
    router.refresh();
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <Tabs defaultValue="cadastro" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="vinculo">Vinculo</TabsTrigger>
          <TabsTrigger value="beneficios">Beneficios</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastro" className="space-y-5">
          <SectionTitle
            title="Bloco cadastral"
            description="Identificacao principal do profissional e status do cadastro."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome completo" error={errors.nome_completo?.message}>
              <input className={inputClassName} {...register("nome_completo")} />
            </Field>
            <Field label="Nome social" error={errors.nome_social?.message}>
              <input className={inputClassName} {...register("nome_social")} />
            </Field>
            <Field label="CPF" error={errors.cpf?.message}>
              <input className={inputClassName} {...register("cpf")} />
            </Field>
            <Field label="Data de nascimento" error={errors.data_nascimento?.message}>
              <input className={inputClassName} type="date" {...register("data_nascimento")} />
            </Field>
            <Field label="E-mail" error={errors.email?.message}>
              <input className={inputClassName} type="email" {...register("email")} />
            </Field>
            <Field label="Telefone" error={errors.telefone?.message}>
              <input className={inputClassName} {...register("telefone")} />
            </Field>
            <Field label="Status do cadastro" error={errors.status_cadastro?.message}>
              <select className={inputClassName} {...register("status_cadastro")}>
                {PjRegistrationStatusEnum.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status documental" error={errors.status_documental?.message}>
              <select className={inputClassName} {...register("status_documental")}>
                {PjDocumentStatusEnum.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Observacoes cadastrais"
              error={errors.observacoes_cadastrais?.message}
              className="space-y-2 text-sm font-medium text-foreground md:col-span-2"
            >
              <textarea className={inputClassName} rows={4} {...register("observacoes_cadastrais")} />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input type="checkbox" {...register("documentacao_pendente")} />
              Documentacao pendente
            </label>
          </div>
        </TabsContent>

        <TabsContent value="empresa" className="space-y-5">
          <SectionTitle
            title="Empresa contratada"
            description="Dados da PJ vinculada ao profissional e situacao documental."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Razao social" error={errors.razao_social?.message}>
              <input className={inputClassName} {...register("razao_social")} />
            </Field>
            <Field label="Nome fantasia" error={errors.nome_fantasia?.message}>
              <input className={inputClassName} {...register("nome_fantasia")} />
            </Field>
            <Field label="CNPJ" error={errors.cnpj?.message}>
              <input className={inputClassName} {...register("cnpj")} />
            </Field>
            <Field label="Municipio / UF" error={errors.municipio_uf_empresa?.message}>
              <input className={inputClassName} {...register("municipio_uf_empresa")} />
            </Field>
            <Field label="Data de recebimento do QSA" error={errors.data_recebimento_qsa?.message}>
              <input className={inputClassName} type="date" {...register("data_recebimento_qsa")} />
            </Field>
            <Field label="Dados bancarios" error={errors.dados_bancarios?.message}>
              <input className={inputClassName} {...register("dados_bancarios")} />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input type="checkbox" {...register("qsa_recebido")} />
              QSA recebido
            </label>
            <Field
              label="Observacoes contratuais"
              error={errors.observacoes_contratuais?.message}
              className="space-y-2 text-sm font-medium text-foreground md:col-span-2"
            >
              <textarea className={inputClassName} rows={4} {...register("observacoes_contratuais")} />
            </Field>
          </div>
        </TabsContent>

        <TabsContent value="vinculo" className="space-y-5">
          <SectionTitle
            title="Vinculo, alocacao e financeiro"
            description="Status operacional, estrutura organizacional e composicao de custo."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Status do vinculo" error={errors.status_vinculo?.message}>
              <select className={inputClassName} {...register("status_vinculo")}>
                {PjStatusEnum.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tipo de contrato" error={errors.tipo_contrato_categoria?.message}>
              <input className={inputClassName} {...register("tipo_contrato_categoria")} />
            </Field>
            <Field label="Data de inicio" error={errors.data_inicio?.message}>
              <input className={inputClassName} type="date" {...register("data_inicio")} />
            </Field>
            <Field label="Data termino prevista" error={errors.data_termino_prevista?.message}>
              <input className={inputClassName} type="date" {...register("data_termino_prevista")} />
            </Field>
            <Field label="Data encerramento real" error={errors.data_encerramento_real?.message}>
              <input className={inputClassName} type="date" {...register("data_encerramento_real")} />
            </Field>
            <Field label="Regime operacional" error={errors.regime_operacional?.message}>
              <input className={inputClassName} {...register("regime_operacional")} />
            </Field>
            <Field label="Gestor responsavel" error={errors.gestor_responsavel?.message}>
              <input className={inputClassName} {...register("gestor_responsavel")} />
            </Field>
            <Field label="Area" error={errors.area?.message}>
              <input className={inputClassName} {...register("area")} />
            </Field>
            <Field label="Marca" error={errors.marca?.message}>
              <input className={inputClassName} {...register("marca")} />
            </Field>
            <Field label="Unidade" error={errors.unidade?.message}>
              <input className={inputClassName} {...register("unidade")} />
            </Field>
            <Field label="Centro de custo" error={errors.centro_custo?.message}>
              <input className={inputClassName} {...register("centro_custo")} />
            </Field>
            <Field label="Empresa de alocacao" error={errors.empresa_alocacao?.message}>
              <input className={inputClassName} {...register("empresa_alocacao")} />
            </Field>
            <Field label="Tipo de prestacao" error={errors.tipo_prestacao?.message}>
              <input className={inputClassName} {...register("tipo_prestacao")} />
            </Field>
            <Field label="Jornada / dedicacao" error={errors.jornada_dedicacao?.message}>
              <input className={inputClassName} {...register("jornada_dedicacao")} />
            </Field>
            <Field label="Valor mensal contratado" error={errors.valor_mensal_contratado?.message}>
              <input
                className={inputClassName}
                type="number"
                step="0.01"
                {...register("valor_mensal_contratado", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Tipo de remuneracao" error={errors.tipo_remuneracao?.message}>
              <select className={inputClassName} {...register("tipo_remuneracao")}>
                {PjRemunerationTypeEnum.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ajuda de custo" error={errors.valor_ajuda_custo?.message}>
              <input
                className={inputClassName}
                type="number"
                step="0.01"
                {...register("valor_ajuda_custo", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Valor total mensal previsto"
              error={errors.valor_total_mensal_previsto?.message}
            >
              <input
                className={inputClassName}
                type="number"
                step="0.01"
                {...register("valor_total_mensal_previsto", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Data-base de reajuste" error={errors.data_base_reajuste?.message}>
              <input className={inputClassName} type="date" {...register("data_base_reajuste")} />
            </Field>
            <Field label="Ultima competencia paga" error={errors.ultima_competencia_paga?.message}>
              <input className={inputClassName} {...register("ultima_competencia_paga")} />
            </Field>
            <Field label="Status de pagamento" error={errors.status_pagamento?.message}>
              <input className={inputClassName} {...register("status_pagamento")} />
            </Field>
            <Field
              label="Historico de reajuste"
              error={errors.historico_reajuste_resumo?.message}
              className="space-y-2 text-sm font-medium text-foreground md:col-span-2"
            >
              <textarea className={inputClassName} rows={3} {...register("historico_reajuste_resumo")} />
            </Field>
            <Field
              label="Observacoes financeiras"
              error={errors.observacoes_financeiras?.message}
              className="space-y-2 text-sm font-medium text-foreground md:col-span-2"
            >
              <textarea className={inputClassName} rows={3} {...register("observacoes_financeiras")} />
            </Field>
          </div>
        </TabsContent>

        <TabsContent value="beneficios" className="space-y-5">
          <SectionTitle
            title="Beneficios e elegibilidade"
            description="Controle de elegibilidade, concessao e custo assistencial."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input type="checkbox" {...register("elegivel_plano_saude")} />
              Elegivel a plano de saude
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input type="checkbox" {...register("elegivel_plano_odontologico")} />
              Elegivel a plano odontologico
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input type="checkbox" {...register("elegivel_vt")} />
              Elegivel a VT
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input type="checkbox" {...register("elegivel_vr_va")} />
              Elegivel a VR/VA
            </label>
            <Field
              label="Beneficios concedidos"
              error={errors.beneficios_concedidos_resumo?.message}
              className="space-y-2 text-sm font-medium text-foreground md:col-span-2"
            >
              <input
                className={inputClassName}
                placeholder="Ex.: Plano saude, odonto, ajuda mobilidade"
                {...register("beneficios_concedidos_resumo")}
              />
            </Field>
            <Field label="Status do beneficio" error={errors.status_beneficio?.message}>
              <select className={inputClassName} {...register("status_beneficio")}>
                {PjBenefitStatusEnum.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fornecedor" error={errors.fornecedor_beneficio?.message}>
              <input className={inputClassName} {...register("fornecedor_beneficio")} />
            </Field>
            <Field label="Produto / plano" error={errors.produto_plano?.message}>
              <input className={inputClassName} {...register("produto_plano")} />
            </Field>
            <Field label="Tipo de custeio" error={errors.tipo_custeio?.message}>
              <input className={inputClassName} {...register("tipo_custeio")} />
            </Field>
            <Field label="Data de inclusao" error={errors.data_inclusao_beneficio?.message}>
              <input className={inputClassName} type="date" {...register("data_inclusao_beneficio")} />
            </Field>
            <Field label="Data de exclusao" error={errors.data_exclusao_beneficio?.message}>
              <input className={inputClassName} type="date" {...register("data_exclusao_beneficio")} />
            </Field>
            <Field label="Subsidio empresa" error={errors.subsidio_empresa?.message}>
              <input
                className={inputClassName}
                type="number"
                step="0.01"
                {...register("subsidio_empresa", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Custo beneficios mensal" error={errors.custo_beneficios_mensal?.message}>
              <input
                className={inputClassName}
                type="number"
                step="0.01"
                {...register("custo_beneficios_mensal", { valueAsNumber: true })}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input type="checkbox" {...register("coparticipacao_aplicavel")} />
              Coparticipacao aplicavel
            </label>
            <Field
              label="Observacoes de regra"
              error={errors.observacoes_regra?.message}
              className="space-y-2 text-sm font-medium text-foreground md:col-span-2"
            >
              <textarea className={inputClassName} rows={4} {...register("observacoes_regra")} />
            </Field>
          </div>
        </TabsContent>
      </Tabs>

      {serverError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {mode === "create" ? "Criar PJ" : "Salvar alteracoes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/pjs")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
