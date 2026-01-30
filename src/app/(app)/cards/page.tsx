import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { listCards } from "@/server/cards";
import { computeBalancesMap } from "@/server/balances";

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

const toNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const limit = toNumber(resolvedParams.limit, 10);
  const offset = toNumber(resolvedParams.offset, 0);
  const { rows, total } = await listCards({
    search: resolvedParams.search,
    marca: resolvedParams.marca,
    unidade: resolvedParams.unidade,
    status: resolvedParams.status,
    limit,
    offset,
  });
  const balances = await computeBalancesMap();

  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const currentPage = Math.floor(offset / limit) + 1;

  const makePageLink = (nextOffset: number) => {
    const params = new URLSearchParams();
    if (resolvedParams.search) params.set("search", resolvedParams.search);
    if (resolvedParams.marca) params.set("marca", resolvedParams.marca);
    if (resolvedParams.unidade) params.set("unidade", resolvedParams.unidade);
    if (resolvedParams.status) params.set("status", resolvedParams.status);
    params.set("limit", String(limit));
    params.set("offset", String(nextOffset));
    return `/cards?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cartões"
        description="Cadastro, status e historico de cada cartao."
        actions={
          <Button asChild>
            <Link href="/cards/new">Novo cartao</Link>
          </Button>
        }
      />

      <form
        method="get"
        className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-5"
      >
        <input
          name="search"
          placeholder="Buscar numero"
          defaultValue={resolvedParams.search ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="marca"
          placeholder="Marca"
          defaultValue={resolvedParams.marca ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          name="unidade"
          placeholder="Unidade"
          defaultValue={resolvedParams.unidade ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={resolvedParams.status ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Status</option>
          <option value="ESTOQUE">ESTOQUE</option>
          <option value="ALOCADO">ALOCADO</option>
          <option value="BLOQUEADO">BLOQUEADO</option>
          <option value="INATIVO">INATIVO</option>
        </select>
        <Button type="submit">Filtrar</Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Numero</th>
              <th className="px-4 py-3 font-medium">Marca</th>
              <th className="px-4 py-3 font-medium">Unidade</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Saldo</th>
              <th className="px-4 py-3 font-medium">Pessoa</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                  Nenhum cartao encontrado.
                </td>
              </tr>
            ) : (
              rows.map((card) => (
                <tr key={card.card_id} className="border-b border-border">
                  <td className="px-4 py-3">{card.numero_cartao}</td>
                  <td className="px-4 py-3">{card.marca}</td>
                  <td className="px-4 py-3">{card.unidade}</td>
                  <td className="px-4 py-3">{card.status}</td>
                  <td className="px-4 py-3">
                    R$ {(balances.get(card.card_id) ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">-</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        className="text-sm font-medium text-primary hover:underline"
                        href={`/cards/${card.card_id}`}
                      >
                        Ver
                      </Link>
                      <Link
                        className="text-sm font-medium text-primary hover:underline"
                        href={`/cards/${card.card_id}/edit`}
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
          Página {currentPage} de {totalPages} · {total} registros
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
