"use client";

import { RotateCcw } from "lucide-react";
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
import { StatusBadge } from "@/modules/coparticipacao/components/StatusBadge";
import { formatCurrencyBR } from "@/modules/coparticipacao/utils/currency";
import type {
  Candidate,
  CopayFilterState,
  CopayRow,
} from "@/modules/coparticipacao/types/copay.types";

type CopayReviewTableProps = {
  rows: CopayRow[];
  filters: CopayFilterState;
  onFiltersChange: (filters: CopayFilterState) => void;
  onResolveManual: (rowId: string, chapa: string, candidate?: Candidate) => void;
  onResetManual: (rowId: string) => void;
};

export function CopayReviewTable({
  rows,
  filters,
  onFiltersChange,
  onResolveManual,
  onResetManual,
}: CopayReviewTableProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-border bg-white/70 p-4 md:grid-cols-2 xl:grid-cols-4">
        <Input
          value={filters.search}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              search: event.target.value,
            })
          }
          placeholder="Buscar por nome ou chapa"
        />
        <Select
          value={filters.status}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              status: event.target.value as CopayFilterState["status"],
            })
          }
        >
          <option value="TODOS">Todos os status</option>
          <option value="OK">OK</option>
          <option value="OK_MANUAL">OK manual</option>
          <option value="AMBIGUO">Ambiguo</option>
          <option value="NAO_ENCONTRADO">Nao encontrado</option>
          <option value="INELEGIVEL">Inelegivel</option>
          <option value="INVALIDO">Invalido</option>
        </Select>
        <Select
          value={filters.tipo}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              tipo: event.target.value as CopayFilterState["tipo"],
            })
          }
        >
          <option value="TODOS">Titular e dependente</option>
          <option value="TITULAR">Titular</option>
          <option value="DEPENDENTE">Dependente</option>
        </Select>
        <Select
          value={filters.sortBy}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              sortBy: event.target.value as CopayFilterState["sortBy"],
            })
          }
        >
          <option value="status">Ordenar por status</option>
          <option value="nome">Ordenar por nome</option>
          <option value="valor">Ordenar por valor</option>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titular / beneficiario</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Chapa resolvida</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Correcao manual</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="font-medium">{row.nome_titular_raw || "-"}</div>
                <div className="text-xs text-muted-foreground">
                  Beneficiario: {row.nome_beneficiario_raw || "-"}
                </div>
                {row.info_colaborador ? (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Base: {row.info_colaborador.nome} | {row.info_colaborador.cargo || "Sem cargo"} |{" "}
                    {row.info_colaborador.situacao || "Sem situacao"}
                  </div>
                ) : null}
              </TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell>{row.titular_ou_dependente}</TableCell>
              <TableCell className="font-medium">{row.chapa_resolvida || "-"}</TableCell>
              <TableCell>{formatCurrencyBR(row.valor_copay)}</TableCell>
              <TableCell className="max-w-xs text-sm text-muted-foreground">
                {row.motivo || "-"}
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Informar chapa"
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        const target = event.currentTarget;
                        const chapa = target.value.trim();
                        if (!chapa) return;
                        onResolveManual(row.id, chapa);
                        target.value = "";
                      }}
                    />
                    {(row.status === "OK_MANUAL" || row.status === "OK") ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onResetManual(row.id)}
                        aria-label="Desfazer vinculacao"
                        title="Desfazer vinculacao"
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                  {row.match_candidates.length > 0 ? (
                    <Select
                      defaultValue=""
                      onChange={(event) => {
                        const chapa = event.target.value;
                        if (!chapa) return;
                        const candidate = row.match_candidates.find((item) => item.chapa === chapa);
                        if (!candidate) return;
                        onResolveManual(row.id, chapa, candidate);
                        event.target.value = "";
                      }}
                    >
                      <option value="">Selecionar candidato sugerido</option>
                      {row.match_candidates.map((candidate) => (
                        <option key={`${row.id}-${candidate.chapa}`} value={candidate.chapa}>
                          {candidate.chapa} | {candidate.nome} | {(candidate.similarity * 100).toFixed(1)}%
                        </option>
                      ))}
                    </Select>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
