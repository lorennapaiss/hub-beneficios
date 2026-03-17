import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PjForm } from "@/components/pjs/pj-form";
import { getPjById } from "@/server/pjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteParams = {
  params: Promise<{ id: string }>;
};

export default async function EditPjPage({ params }: RouteParams) {
  const { id } = await params;
  const pj = await getPjById(id);
  if (!pj) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Editar PJ" description="Atualize o cadastro operacional do profissional." />
      <div className="rounded-lg border border-border bg-card p-6">
        <PjForm
          mode="edit"
          pjId={pj.pj_id}
          initialValues={{
            nome_completo: pj.nome_completo,
            nome_social: pj.nome_social,
            cpf: pj.cpf,
            data_nascimento: pj.data_nascimento,
            email: pj.email,
            telefone: pj.telefone,
            status_cadastro: pj.status_cadastro as "RASCUNHO" | "PENDENTE" | "COMPLETO",
            observacoes_cadastrais: pj.observacoes_cadastrais,
            razao_social: pj.razao_social,
            nome_fantasia: pj.nome_fantasia,
            cnpj: pj.cnpj,
            qsa_recebido: pj.qsa_recebido === "true",
            data_recebimento_qsa: pj.data_recebimento_qsa,
            status_documental: pj.status_documental as "PENDENTE" | "EM_ANALISE" | "REGULAR",
            municipio_uf_empresa: pj.municipio_uf_empresa,
            dados_bancarios: pj.dados_bancarios,
            observacoes_contratuais: pj.observacoes_contratuais,
            status_vinculo: pj.status_vinculo as "EM_ATIVACAO" | "ATIVO" | "SUSPENSO" | "ENCERRADO",
            data_inicio: pj.data_inicio,
            data_termino_prevista: pj.data_termino_prevista,
            data_encerramento_real: pj.data_encerramento_real,
            tipo_contrato_categoria: pj.tipo_contrato_categoria,
            regime_operacional: pj.regime_operacional,
            gestor_responsavel: pj.gestor_responsavel,
            area: pj.area,
            marca: pj.marca,
            unidade: pj.unidade,
            centro_custo: pj.centro_custo,
            empresa_alocacao: pj.empresa_alocacao,
            tipo_prestacao: pj.tipo_prestacao,
            jornada_dedicacao: pj.jornada_dedicacao,
            valor_mensal_contratado: Number(pj.valor_mensal_contratado) || 0,
            tipo_remuneracao: pj.tipo_remuneracao as "FIXO" | "VARIAVEL" | "MISTO",
            valor_ajuda_custo: Number(pj.valor_ajuda_custo) || 0,
            valor_total_mensal_previsto: Number(pj.valor_total_mensal_previsto) || 0,
            data_base_reajuste: pj.data_base_reajuste,
            historico_reajuste_resumo: pj.historico_reajuste_resumo,
            status_pagamento: pj.status_pagamento,
            ultima_competencia_paga: pj.ultima_competencia_paga,
            observacoes_financeiras: pj.observacoes_financeiras,
            elegivel_plano_saude: pj.elegivel_plano_saude === "true",
            elegivel_plano_odontologico: pj.elegivel_plano_odontologico === "true",
            elegivel_vt: pj.elegivel_vt === "true",
            elegivel_vr_va: pj.elegivel_vr_va === "true",
            beneficios_concedidos_resumo: pj.beneficios_concedidos_resumo,
            fornecedor_beneficio: pj.fornecedor_beneficio,
            produto_plano: pj.produto_plano,
            data_inclusao_beneficio: pj.data_inclusao_beneficio,
            data_exclusao_beneficio: pj.data_exclusao_beneficio,
            tipo_custeio: pj.tipo_custeio,
            subsidio_empresa: Number(pj.subsidio_empresa) || 0,
            coparticipacao_aplicavel: pj.coparticipacao_aplicavel === "true",
            status_beneficio: pj.status_beneficio as "NAO_CONCEDIDO" | "ATIVO" | "ENCERRADO",
            observacoes_regra: pj.observacoes_regra,
            custo_beneficios_mensal: Number(pj.custo_beneficios_mensal) || 0,
            documentacao_pendente: pj.documentacao_pendente === "true",
          }}
        />
      </div>
    </div>
  );
}
