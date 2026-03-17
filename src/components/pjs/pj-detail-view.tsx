import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PjDetail } from "@/server/pjs";

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const DetailGrid = ({ items }: { items: Array<{ label: string; value: string }> }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {items.map((item) => (
      <div key={item.label} className="space-y-1 rounded-lg border border-border/70 p-3">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {item.label}
        </div>
        <div className="text-sm font-medium text-foreground">{item.value || "-"}</div>
      </div>
    ))}
  </div>
);

export function PjDetailView({ detail }: { detail: PjDetail }) {
  const { pj, financialHistory, benefitHistory, allocationHistory } = detail;

  return (
    <div className="space-y-6">
      <Section title="Resumo operacional">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{pj.status_vinculo}</Badge>
          <Badge className="border-border/80">{pj.status_documental}</Badge>
          <Badge className="border-border/80">{pj.status_beneficio}</Badge>
          {pj.pendencias.length > 0 ? (
            pj.pendencias.map((item) => (
              <Badge key={item} className="border-border/80 bg-muted text-foreground">
                {item}
              </Badge>
            ))
          ) : (
            <Badge className="border-border/80 bg-muted text-foreground">
              Sem pendencias criticas
            </Badge>
          )}
        </div>
      </Section>

      <Section title="Cadastro">
        <DetailGrid
          items={[
            { label: "ID interno", value: pj.pj_id },
            { label: "Nome completo", value: pj.nome_completo },
            { label: "CPF", value: pj.cpf },
            { label: "E-mail", value: pj.email },
            { label: "Telefone", value: pj.telefone },
            { label: "Status cadastro", value: pj.status_cadastro },
          ]}
        />
      </Section>

      <Section title="Empresa contratada">
        <DetailGrid
          items={[
            { label: "Razao social", value: pj.razao_social },
            { label: "Nome fantasia", value: pj.nome_fantasia },
            { label: "CNPJ", value: pj.cnpj },
            { label: "QSA recebido", value: pj.qsa_recebido },
            { label: "Status documental", value: pj.status_documental },
            { label: "Municipio / UF", value: pj.municipio_uf_empresa },
          ]}
        />
      </Section>

      <Section title="Vinculo e custo">
        <DetailGrid
          items={[
            { label: "Gestor", value: pj.gestor_responsavel },
            { label: "Area", value: pj.area },
            { label: "Marca", value: pj.marca },
            { label: "Centro de custo", value: pj.centro_custo },
            { label: "Valor mensal", value: formatCurrency(pj.valor_mensal_contratado) },
            { label: "Custo total mensal", value: formatCurrency(pj.custo_total_mensal) },
          ]}
        />
      </Section>

      <Section title="Historico financeiro">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Vigencia</th>
                <th className="px-4 py-3 font-medium">Remuneracao</th>
                <th className="px-4 py-3 font-medium">Ajuda de custo</th>
                <th className="px-4 py-3 font-medium">Total previsto</th>
              </tr>
            </thead>
            <tbody>
              {financialHistory.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-muted-foreground" colSpan={4}>
                    Sem historico financeiro.
                  </td>
                </tr>
              ) : (
                financialHistory.map((item) => (
                  <tr key={item.pj_financial_history_id} className="border-b border-border">
                    <td className="px-4 py-3">{item.data_vigencia}</td>
                    <td className="px-4 py-3">{formatCurrency(item.valor_mensal_contratado)}</td>
                    <td className="px-4 py-3">{formatCurrency(item.valor_ajuda_custo)}</td>
                    <td className="px-4 py-3">{formatCurrency(item.valor_total_mensal_previsto)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Beneficios">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Beneficio</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Fornecedor</th>
                <th className="px-4 py-3 font-medium">Inclusao</th>
              </tr>
            </thead>
            <tbody>
              {benefitHistory.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-muted-foreground" colSpan={4}>
                    Sem beneficios registrados.
                  </td>
                </tr>
              ) : (
                benefitHistory.map((item) => (
                  <tr key={item.pj_benefit_id} className="border-b border-border">
                    <td className="px-4 py-3">{item.beneficio}</td>
                    <td className="px-4 py-3">{item.status}</td>
                    <td className="px-4 py-3">{item.fornecedor || "-"}</td>
                    <td className="px-4 py-3">{item.data_inclusao || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Alocacoes">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Marca</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Gestor</th>
                <th className="px-4 py-3 font-medium">Inicio</th>
              </tr>
            </thead>
            <tbody>
              {allocationHistory.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-muted-foreground" colSpan={4}>
                    Sem alocacoes registradas.
                  </td>
                </tr>
              ) : (
                allocationHistory.map((item) => (
                  <tr key={item.pj_allocation_id} className="border-b border-border">
                    <td className="px-4 py-3">{item.marca}</td>
                    <td className="px-4 py-3">{item.area}</td>
                    <td className="px-4 py-3">{item.gestor_responsavel}</td>
                    <td className="px-4 py-3">{item.data_inicio}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
