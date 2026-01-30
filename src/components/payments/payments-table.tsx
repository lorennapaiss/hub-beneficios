"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/payments/status-badge";
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

type PaymentRow = {
  id: string;
  owner_name?: string;
  category?: string;
  brand?: string;
  provider?: string;
  competence?: string;
  amount?: number;
  due_date?: string;
  status?: string;
  ticket_number?: string;
};

type PaymentsTableProps = {
  rows: PaymentRow[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const formatDate = (value?: string) => {
  if (!value) return "-";
  const normalized = value.length === 10 ? `${value}T00:00:00` : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR").format(parsed);
};

export default function PaymentsTable({ rows }: PaymentsTableProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [provider, setProvider] = useState("all");
  const [competence, setCompetence] = useState("all");
  const [owner, setOwner] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const options = useMemo(() => {
    const unique = (key: keyof PaymentRow) =>
      Array.from(new Set(rows.map((row) => row[key]).filter(Boolean)));
    return {
      categories: unique("category"),
      brands: unique("brand"),
      providers: unique("provider"),
      competences: unique("competence"),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const filteredRows = rows.filter((row) => {
      if (status != "all" && row.status != status) return false;
      if (category != "all" && row.category != category) return false;
      if (brand != "all" && row.brand != brand) return false;
      if (provider != "all" && row.provider != provider) return false;
      if (competence != "all" && row.competence != competence) return false;
      if (owner) {
        const ownerLower = owner.toLowerCase();
        if (!row.owner_name?.toLowerCase().includes(ownerLower)) return false;
      }
      if (query) {
        const ticket = row.ticket_number?.toLowerCase() ?? "";
        if (!ticket.includes(query.toLowerCase())) return false;
      }
      return true;
    });

    return filteredRows.sort((a, b) =>
      (a.due_date ?? "").localeCompare(b.due_date ?? ""),
    );
  }, [category, competence, owner, provider, query, rows, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const hasFilters =
    query ||
    owner ||
    status !== "all" ||
    category !== "all" ||
    brand !== "all" ||
    provider !== "all" ||
    competence !== "all";

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const clearFilters = () => {
    setQuery("");
    setOwner("");
    setStatus("all");
    setCategory("all");
    setBrand("all");
    setProvider("all");
    setCompetence("all");
    setPage(1);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          aria-label="Buscar por ticket"
          placeholder="Buscar por ticket"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          className="w-56"
        />
        <Input
          aria-label="Responsavel"
          placeholder="Responsavel"
          value={owner}
          onChange={(event) => {
            setOwner(event.target.value);
            setPage(1);
          }}
          className="w-44"
        />
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">Status</option>
          <option value="AGUARDANDO_PAGAMENTO">Aguardando</option>
          <option value="EM_ACOMPANHAMENTO">Em acompanhamento</option>
          <option value="PAGO">Pago</option>
          <option value="ATRASADO">Atrasado</option>
        </Select>
        <Select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">Categoria</option>
          {options.categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select
          value={brand}
          onChange={(event) => {
            setBrand(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">Marca</option>
          {options.brands.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select
          value={provider}
          onChange={(event) => {
            setProvider(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">Fornecedor</option>
          {options.providers.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select
          value={competence}
          onChange={(event) => {
            setCompetence(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">Competencia</option>
          {options.competences.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearFilters}
          disabled={!hasFilters}
        >
          Limpar filtros
        </Button>
      </div>
      <div className="text-sm text-muted-foreground">
        Resultados: {filtered.length}
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Responsavel</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Competencia</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-6 text-center text-muted-foreground">
                  {rows.length === 0
                    ? "Nenhum pagamento cadastrado ainda."
                    : "Nenhum pagamento encontrado com os filtros atuais."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.ticket_number ?? row.id}
                  </TableCell>
                  <TableCell>{row.owner_name ?? "-"}</TableCell>
                  <TableCell>{row.category ?? "-"}</TableCell>
                  <TableCell>{row.brand ?? "-"}</TableCell>
                  <TableCell>{row.provider ?? "-"}</TableCell>
                  <TableCell>{row.competence ?? "-"}</TableCell>
                  <TableCell>{formatDate(row.due_date)}</TableCell>
                  <TableCell>
                    {row.amount ? formatCurrency(row.amount) : "-"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status ?? "RASCUNHO"} />
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="xs">
                      <Link href={`/beneficios/pagamentos/${row.id}`}>Ver</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {page} de {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            className="bg-muted text-foreground hover:bg-muted/80"
            disabled={page == 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Anterior
          </Button>
          <Button
            className="bg-muted text-foreground hover:bg-muted/80"
            disabled={page == totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Próxima
          </Button>
        </div>
      </div>
    </section>
  );
}
