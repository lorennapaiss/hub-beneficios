import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { getPagination, makePageLinkBuilder } from "@/lib/pagination";
import { listLoads } from "@/server/loads";

export const dynamic = "force-dynamic";
export const revalidate = 0;


type SearchParams = {
  from?: string;
  to?: string;
  numero_cartao?: string;
  marca?: string;
  unidade?: string;
  limit?: string;
  offset?: string;
};

export default async function LoadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const { limit, offset, totalPages, currentPage } = getPagination(resolvedParams);
  const { rows, total } = await listLoads({
    from: resolvedParams.from,
    to: resolvedParams.to,
    numero_cartao: resolvedParams.numero_cartao,
    marca: resolvedParams.marca,
    unidade: resolvedParams.unidade,
    limit,
    offset,
  });

  const makePageLink = makePageLinkBuilder("/loads", {
    from: resolvedParams.from,
    to: resolvedParams.to,
    numero_cartao: resolvedParams.numero_cartao,
    marca: resolvedParams.marca,
    unidade: resolvedParams.unidade,
  }, limit);

  return (
    <div className="space-y-6">
      <PageHeader title="Cargas" description="Registro de cargas por período." />

      <form
        method="get"
        className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-6"
      >
        <input
          type="date"
          name="from"
          placeholder="De"
          aria-label="De"
          defaultValue={resolvedParams.from ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          type="date"
          name="to"
          placeholder="Ate"
          aria-label="Ate"
          defaultValue={resolvedParams.to ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="numero_cartao"
          placeholder="Numero do cartao"
          aria-label="Numero do cartao"
          defaultValue={resolvedParams.numero_cartao ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="marca"
          placeholder="Marca"
          aria-label="Marca"
          defaultValue={resolvedParams.marca ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="unidade"
          placeholder="Unidade"
          aria-label="Unidade"
          defaultValue={resolvedParams.unidade ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <Button type="submit">Filtrar</Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Cartao</th>
              <th className="px-4 py-3 font-medium">Marca</th>
              <th className="px-4 py-3 font-medium">Unidade</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 text-right font-medium">Comprovante</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  Nenhuma carga encontrada.
                </td>
              </tr>
            ) : (
              rows.map((load) => (
                <tr key={load.load_id} className="border-b border-border">
                  <td className="px-4 py-3">{load.data_carga}</td>
                  <td className="px-4 py-3">
                    {load.card?.numero_cartao ? (
                      <Link
                        className="font-medium text-primary hover:underline"
                        href={`/cards/${load.card.card_id}`}
                      >
                        {load.card.numero_cartao}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3">{load.card?.marca ?? "-"}</td>
                  <td className="px-4 py-3">{load.card?.unidade ?? "-"}</td>
                  <td className="px-4 py-3">R$ {load.valor_carga}</td>
                  <td className="px-4 py-3 text-right">
                    {load.comprovante_url ? (
                      <a
                        className="text-sm font-medium text-primary hover:underline"
                        href={load.comprovante_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          Página {currentPage} de {totalPages(total)} · {total} registros
        </span>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            disabled={offset <= 0}
            className="disabled:pointer-events-none disabled:opacity-50"
          >
            <Link href={makePageLink(Math.max(offset - limit, 0))}>Anterior</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            disabled={offset + limit >= total}
            className="disabled:pointer-events-none disabled:opacity-50"
          >
            <Link href={makePageLink(offset + limit)}>Próxima</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
