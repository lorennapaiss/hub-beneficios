import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { getPagination, makePageLinkBuilder } from "@/lib/pagination";
import { listPeople } from "@/server/people";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = {
  search?: string;
  marca?: string;
  unidade?: string;
  status?: string;
  limit?: string;
  offset?: string;
};

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const { limit, offset, totalPages, currentPage } = getPagination(resolvedParams);
  const { rows, total } = await listPeople({
    search: resolvedParams.search,
    marca: resolvedParams.marca,
    unidade: resolvedParams.unidade,
    status: resolvedParams.status,
    limit,
    offset,
  });

  const makePageLink = makePageLinkBuilder("/people", {
    search: resolvedParams.search,
    marca: resolvedParams.marca,
    unidade: resolvedParams.unidade,
    status: resolvedParams.status,
  }, limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pessoas"
        description="Cadastro de colaboradores para alocações."
        actions={
          <Button asChild>
            <Link href="/people/new">Nova pessoa</Link>
          </Button>
        }
      />

      <form
        method="get"
        className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-5"
      >
        <input
          name="search"
          placeholder="Buscar nome ou chapa"
          aria-label="Buscar nome ou chapa"
          defaultValue={resolvedParams.search ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="marca"
          placeholder="Marca"
          aria-label="Filtrar por marca"
          defaultValue={resolvedParams.marca ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="unidade"
          placeholder="Unidade"
          aria-label="Filtrar por unidade"
          defaultValue={resolvedParams.unidade ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          name="status"
          aria-label="Filtrar por status"
          defaultValue={resolvedParams.status ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Status</option>
          <option value="ATIVO">ATIVO</option>
          <option value="INATIVO">INATIVO</option>
        </select>
        <Button type="submit">Filtrar</Button>
      </form>
      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href="/people">Limpar filtros</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Chapa</th>
              <th className="px-4 py-3 font-medium">Marca</th>
              <th className="px-4 py-3 font-medium">Unidade</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  Nenhuma pessoa encontrada.
                </td>
              </tr>
            ) : (
              rows.map((person) => (
                <tr key={person.person_id} className="border-b border-border">
                  <td className="px-4 py-3">{person.nome}</td>
                  <td className="px-4 py-3">{person.chapa_matricula}</td>
                  <td className="px-4 py-3">{person.marca}</td>
                  <td className="px-4 py-3">{person.unidade}</td>
                  <td className="px-4 py-3">{person.status}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      className="text-sm font-medium text-primary hover:underline"
                      href={`/people/${person.person_id}/edit`}
                    >
                      Editar
                    </Link>
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
