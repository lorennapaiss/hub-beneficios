import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PjImportDialog } from "@/components/pjs/pj-import-dialog";
import { PjSummaryCards } from "@/components/pjs/pj-summary-cards";
import { listPjs } from "@/server/pjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = {
  search?: string;
  status_vinculo?: string;
  marca?: string;
  area?: string;
  gestor_responsavel?: string;
  centro_custo?: string;
  status_documental?: string;
  benefit_status?: string;
  limit?: string;
  offset?: string;
};

const toNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export default async function PjsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const limit = toNumber(resolvedParams.limit, 10);
  const offset = toNumber(resolvedParams.offset, 0);
  const { rows, total, summary } = await listPjs({
    search: resolvedParams.search,
    status_vinculo: resolvedParams.status_vinculo,
    marca: resolvedParams.marca,
    area: resolvedParams.area,
    gestor_responsavel: resolvedParams.gestor_responsavel,
    centro_custo: resolvedParams.centro_custo,
    status_documental: resolvedParams.status_documental,
    benefit_status: resolvedParams.benefit_status,
    limit,
    offset,
  });

  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const currentPage = Math.floor(offset / limit) + 1;

  const buildQuery = (extra: Record<string, string>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({
      search: resolvedParams.search,
      status_vinculo: resolvedParams.status_vinculo,
      marca: resolvedParams.marca,
      area: resolvedParams.area,
      gestor_responsavel: resolvedParams.gestor_responsavel,
      centro_custo: resolvedParams.centro_custo,
      status_documental: resolvedParams.status_documental,
      benefit_status: resolvedParams.benefit_status,
      limit: String(limit),
      ...extra,
    })) {
      if (value) params.set(key, value);
    }
    return params.toString();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de PJs"
        description="Base mestre, pendencias operacionais e custo consolidado de profissionais PJ."
        actions={
          <div className="flex gap-2">
            <PjImportDialog />
            <Button asChild variant="outline">
              <Link href={`/api/pjs/export?${buildQuery({ offset: "0" })}`}>Exportar CSV</Link>
            </Button>
            <Button asChild>
              <Link href="/pjs/new">Novo PJ</Link>
            </Button>
          </div>
        }
      />

      <PjSummaryCards summary={summary} />

      <form
        method="get"
        className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-4 xl:grid-cols-5"
      >
        <input
          name="search"
          placeholder="Nome, CPF, CNPJ ou ID"
          defaultValue={resolvedParams.search ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          name="status_vinculo"
          defaultValue={resolvedParams.status_vinculo ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Status vinculo</option>
          <option value="EM_ATIVACAO">EM_ATIVACAO</option>
          <option value="ATIVO">ATIVO</option>
          <option value="SUSPENSO">SUSPENSO</option>
          <option value="ENCERRADO">ENCERRADO</option>
        </select>
        <input
          name="marca"
          placeholder="Marca"
          defaultValue={resolvedParams.marca ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="area"
          placeholder="Area"
          defaultValue={resolvedParams.area ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="gestor_responsavel"
          placeholder="Gestor"
          defaultValue={resolvedParams.gestor_responsavel ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="centro_custo"
          placeholder="Centro de custo"
          defaultValue={resolvedParams.centro_custo ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          name="status_documental"
          defaultValue={resolvedParams.status_documental ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Status documental</option>
          <option value="PENDENTE">PENDENTE</option>
          <option value="EM_ANALISE">EM_ANALISE</option>
          <option value="REGULAR">REGULAR</option>
        </select>
        <select
          name="benefit_status"
          defaultValue={resolvedParams.benefit_status ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Status beneficio</option>
          <option value="NAO_CONCEDIDO">NAO_CONCEDIDO</option>
          <option value="ATIVO">ATIVO</option>
          <option value="ENCERRADO">ENCERRADO</option>
        </select>
        <Button type="submit">Filtrar</Button>
      </form>

      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href="/pjs">Limpar filtros</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Profissional</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Alocacao</th>
              <th className="px-4 py-3 font-medium">Beneficios</th>
              <th className="px-4 py-3 font-medium">Custo</th>
              <th className="px-4 py-3 font-medium">Pendencias</th>
              <th className="px-4 py-3 text-right font-medium">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                  Nenhum PJ encontrado.
                </td>
              </tr>
            ) : (
              rows.map((pj) => (
                <tr key={pj.pj_id} className="border-b border-border align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{pj.nome_completo}</div>
                    <div className="text-xs text-muted-foreground">
                      {pj.cpf} · {pj.status_vinculo}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{pj.razao_social}</div>
                    <div className="text-xs text-muted-foreground">{pj.cnpj}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{pj.marca || "-"}</div>
                    <div className="text-xs text-muted-foreground">
                      {pj.area || "-"} · {pj.centro_custo || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{pj.status_beneficio}</div>
                    <div className="text-xs text-muted-foreground">
                      {pj.beneficios_concedidos_resumo || "Sem configuracao"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(pj.custo_total_mensal)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {pj.pendencias.length === 0 ? (
                        <Badge className="border-border/80 bg-muted text-foreground">OK</Badge>
                      ) : (
                        pj.pendencias.map((item) => (
                          <Badge key={item} className="border-border/80">
                            {item}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        className="text-sm font-medium text-primary hover:underline"
                        href={`/pjs/${pj.pj_id}`}
                      >
                        Ficha
                      </Link>
                      <Link
                        className="text-sm font-medium text-primary hover:underline"
                        href={`/pjs/${pj.pj_id}/edit`}
                      >
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          Pagina {currentPage} de {totalPages} · {total} registros
        </span>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            disabled={offset <= 0}
            className="disabled:pointer-events-none disabled:opacity-50"
          >
            <Link href={`/pjs?${buildQuery({ offset: String(Math.max(offset - limit, 0)) })}`}>
              Anterior
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            disabled={offset + limit >= total}
            className="disabled:pointer-events-none disabled:opacity-50"
          >
            <Link href={`/pjs?${buildQuery({ offset: String(offset + limit) })}`}>Proxima</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
