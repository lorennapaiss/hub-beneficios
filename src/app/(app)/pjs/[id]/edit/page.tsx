import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PjForm } from "@/components/pjs/pj-form";
import type {
  PjBenefitConfig,
  PjBenefits,
  PjHealthBenefitConfig,
  PjHealthDependent,
} from "@/lib/schemas/pj";
import type { PjBenefitHistoryRow, PjListItem } from "@/server/pjs";
import { parseHealthDependentObservation } from "@/server/pjs";
import { getPjDetailById } from "@/server/pjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteParams = {
  params: Promise<{ id: string }>;
};

const defaultBenefit: PjBenefitConfig = {
  elegivel: false,
  status: "NAO_CONCEDIDO",
  fornecedor: "",
  produto_plano: "",
  tipo_custeio: "",
  data_inclusao: "",
  data_exclusao: "",
  subsidio_empresa: 0,
  custo_mensal: 0,
  coparticipacao_aplicavel: false,
  observacoes_regra: "",
};

const benefitMap = {
  PLANO_SAUDE: "plano_saude",
  PLANO_ODONTO: "plano_odontologico",
  VT: "vt",
  VR_VA: "vr_va",
} as const;

const buildInitialBenefits = (benefitHistory: PjBenefitHistoryRow[], pj: PjListItem): PjBenefits => {
  const dependentes = benefitHistory
    .filter((item) => item.beneficio === "PLANO_SAUDE_DEPENDENTE")
    .map((item) => parseHealthDependentObservation(item.observacoes))
    .filter((item): item is PjHealthDependent => item !== null);

  const latestRows = [...benefitHistory].reverse().reduce<Partial<Record<keyof PjBenefits, PjBenefitHistoryRow>>>(
    (acc, item) => {
      const key = benefitMap[item.beneficio as keyof typeof benefitMap];
      if (key && !acc[key]) {
        acc[key] = item;
      }
      return acc;
    },
    {},
  );

  const fromRow = (key: Exclude<keyof PjBenefits, "plano_saude">): PjBenefitConfig => {
    const row = latestRows[key];
    if (row) {
      return {
        elegivel: row.elegivel === "true",
        status: row.status as PjBenefitConfig["status"],
        fornecedor: row.fornecedor,
        produto_plano: row.produto_plano,
        tipo_custeio: row.tipo_custeio,
        data_inclusao: row.data_inclusao,
        data_exclusao: row.data_exclusao,
        subsidio_empresa: Number(row.subsidio_empresa) || 0,
        custo_mensal: 0,
        coparticipacao_aplicavel: row.coparticipacao === "true",
        observacoes_regra: row.observacoes,
      };
    }

    return {
      ...defaultBenefit,
      elegivel:
        key === "plano_odontologico"
          ? pj.elegivel_plano_odontologico === "true"
          : key === "vt"
            ? pj.elegivel_vt === "true"
            : pj.elegivel_vr_va === "true",
      status: "NAO_CONCEDIDO",
      fornecedor: "",
      produto_plano: "",
      tipo_custeio: "",
      data_inclusao: "",
      data_exclusao: "",
      subsidio_empresa: 0,
      custo_mensal: 0,
      coparticipacao_aplicavel: false,
      observacoes_regra: "",
    };
  };

  const healthRow = latestRows.plano_saude;
  const planoSaude: PjHealthBenefitConfig = healthRow
    ? {
        elegivel: healthRow.elegivel === "true",
        status: healthRow.status as PjHealthBenefitConfig["status"],
        fornecedor: healthRow.fornecedor,
        produto_plano: healthRow.produto_plano,
        tipo_custeio: healthRow.tipo_custeio,
        data_inclusao: healthRow.data_inclusao,
        data_exclusao: healthRow.data_exclusao,
        subsidio_empresa: Number(healthRow.subsidio_empresa) || 0,
        custo_mensal: 0,
        coparticipacao_aplicavel: healthRow.coparticipacao === "true",
        observacoes_regra: healthRow.observacoes,
        dependentes,
      }
    : {
        ...defaultBenefit,
        elegivel: pj.elegivel_plano_saude === "true",
        status: pj.status_beneficio as PjHealthBenefitConfig["status"],
        fornecedor: pj.fornecedor_beneficio,
        produto_plano: pj.produto_plano,
        tipo_custeio: pj.tipo_custeio,
        data_inclusao: pj.data_inclusao_beneficio,
        data_exclusao: pj.data_exclusao_beneficio,
        subsidio_empresa: Number(pj.subsidio_empresa) || 0,
        custo_mensal: 0,
        coparticipacao_aplicavel: pj.coparticipacao_aplicavel === "true",
        observacoes_regra: pj.observacoes_regra,
        dependentes,
      };

  return {
    plano_saude: planoSaude,
    plano_odontologico: fromRow("plano_odontologico"),
    vt: fromRow("vt"),
    vr_va: fromRow("vr_va"),
  };
};

export default async function EditPjPage({ params }: RouteParams) {
  const { id } = await params;
  const detail = await getPjDetailById(id);
  if (!detail) {
    notFound();
  }

  const { pj, benefitHistory } = detail;

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
            beneficios: buildInitialBenefits(benefitHistory, pj),
            documentacao_pendente: pj.documentacao_pendente === "true",
          }}
        />
      </div>
    </div>
  );
}
