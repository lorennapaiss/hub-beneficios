import Link from "next/link";
import { Plus, Search, UserRound } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { getPagination, makePageLinkBuilder } from "@/lib/pagination";
import { listPeople } from "@/server/people";
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

  const makePageLink = makePageLinkBuilder(
    "/people",
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
        eyebrow="Cadastro mestre"
        title="Pessoas"
        description="Gestão de colaboradores com filtros de operação e acesso rápido a edição cadastral."
        actions={
          <>
            <Badge>{total} registros</Badge>
            <Button asChild>
              <Link href="/people/new">
                <Plus className="size-4" />
                Nova pessoa
              </Link>
            </Button>
          </>
        }
      />

      <form method="get" className="toolbar-panel">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Buscar por nome ou chapa"
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
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </Select>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Aplicar
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/people">Limpar</Link>
            </Button>
          </div>
        </div>
      </form>

      <section className="table-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Base de colaboradores</h2>
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages(total)}
            </p>
          </div>
          <Badge className="bg-background">{total} resultados</Badge>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={UserRound}
              title="Nenhuma pessoa encontrada"
              description="Revise os filtros aplicados ou cadastre um novo colaborador para iniciar a operação."
              action={
                <Button asChild>
                  <Link href="/people/new">Cadastrar pessoa</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Chapa</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((person) => (
                <TableRow key={person.person_id}>
                  <TableCell className="font-medium text-foreground">{person.nome}</TableCell>
                  <TableCell>{person.chapa_matricula}</TableCell>
                  <TableCell>{person.marca}</TableCell>
                  <TableCell>{person.unidade}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        person.status === "ATIVO"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-700"
                      }
                    >
                      {person.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="xs">
                      <Link href={`/people/${person.person_id}/edit`}>Editar</Link>
                    </Button>
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
