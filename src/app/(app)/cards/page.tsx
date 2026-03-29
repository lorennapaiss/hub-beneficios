import Link from "next/link";
import { CreditCard, Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { getPagination, makePageLinkBuilder } from "@/lib/pagination";
import { computeBalancesMap } from "@/server/balances";
import { listCards } from "@/server/cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const { limit, offset, totalPages, currentPage } = getPagination(resolvedParams);
  const { rows, total } = await listCards({
    search: resolvedParams.search,
    marca: resolvedParams.marca,
    unidade: resolvedParams.unidade,
    status: resolvedParams.status,
    limit,
    offset,
  });
  const balances = await computeBalancesMap();

  const makePageLink = makePageLinkBuilder(
    "/cards",
    {
      search: resolvedParams.search,
      marca: resolvedParams.marca,
      unidade: resolvedParams.unidade,
      status: resolvedParams.status,
    },
    limit,
  );

  return (
    <div className="page-section">
      <PageHeader
        eyebrow="Controle operacional"
        title="Cartões"
        description="Gestão centralizada de cartões provisórios, com foco em disponibilidade, saldo e rastreabilidade."
        actions={
          <>
            <Badge>{total} cartões</Badge>
            <Button asChild>
              <Link href="/cards/new">
                <Plus className="size-4" />
                Novo cartão
              </Link>
            </Button>
          </>
        }
      />

      <form method="get" className="toolbar-panel">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_0.9fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Buscar por número do cartão"
              defaultValue={resolvedParams.search ?? ""}
              className="pl-9"
            />
          </div>
          <Input
            name="marca"
            placeholder="Filtrar por marca"
            defaultValue={resolvedParams.marca ?? ""}
          />
          <Input
            name="unidade"
            placeholder="Filtrar por unidade"
            defaultValue={resolvedParams.unidade ?? ""}
          />
          <Select name="status" defaultValue={resolvedParams.status ?? ""}>
            <option value="">Todos os status</option>
            <option value="ESTOQUE">Estoque</option>
            <option value="ALOCADO">Alocado</option>
            <option value="BLOQUEADO">Bloqueado</option>
            <option value="INATIVO">Inativo</option>
          </Select>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Aplicar
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/cards">Limpar</Link>
            </Button>
          </div>
        </div>
      </form>

      <section className="table-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Inventário de cartões</h2>
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages(total)}
            </p>
          </div>
          <Badge className="bg-background">{total} resultados</Badge>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CreditCard}
              title="Nenhum cartão encontrado"
              description="Ajuste os filtros ou cadastre um novo cartão para manter o inventário atualizado."
              action={
                <Button asChild>
                  <Link href="/cards/new">Cadastrar cartão</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Pessoa</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((card) => (
                <TableRow key={card.card_id}>
                  <TableCell className="font-medium text-foreground">
                    {card.numero_cartao}
                  </TableCell>
                  <TableCell>{card.marca}</TableCell>
                  <TableCell>{card.unidade}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        card.status === "ALOCADO"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : card.status === "ESTOQUE"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : card.status === "BLOQUEADO"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-slate-200 bg-slate-100 text-slate-700"
                      }
                    >
                      {card.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {currencyFormatter.format(balances.get(card.card_id) ?? 0)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">-</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="xs">
                        <Link href={`/cards/${card.card_id}`}>Ver</Link>
                      </Button>
                      <Button asChild variant="outline" size="xs">
                        <Link href={`/cards/${card.card_id}/edit`}>Editar</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

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
