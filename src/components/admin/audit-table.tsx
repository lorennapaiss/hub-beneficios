"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AuditRow } from "@/server/audit";

type AuditTableProps = {
  rows: AuditRow[];
};

const formatJson = (value: string) => {
  if (!value) return "Sem dados.";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

export function AuditTable({ rows }: AuditTableProps) {
  const [selected, setSelected] = useState<AuditRow | null>(null);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/40 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Data</th>
            <th className="px-4 py-3 font-medium">Usuário</th>
            <th className="px-4 py-3 font-medium">Entidade</th>
            <th className="px-4 py-3 font-medium">Ação</th>
            <th className="px-4 py-3 font-medium">ID</th>
            <th className="px-4 py-3 text-right font-medium">Detalhes</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                Nenhum registro encontrado.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.audit_id} className="border-b border-border">
                <td className="px-4 py-3">{row.created_at}</td>
                <td className="px-4 py-3">{row.created_by}</td>
                <td className="px-4 py-3">{row.entity_type}</td>
                <td className="px-4 py-3">{row.action}</td>
                <td className="px-4 py-3">{row.entity_id}</td>
                <td className="px-4 py-3 text-right">
                  <Dialog
                    open={selected?.audit_id === row.audit_id}
                    onOpenChange={(open) => setSelected(open ? row : null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected(row)}
                      >
                        Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Detalhes da auditoria</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-xs uppercase text-muted-foreground">
                            Before
                          </div>
                          <pre className="mt-2 max-h-[360px] overflow-auto rounded-md bg-muted/40 p-3 text-xs">
                            {formatJson(row.before_json)}
                          </pre>
                        </div>
                        <div>
                          <div className="text-xs uppercase text-muted-foreground">
                            After
                          </div>
                          <pre className="mt-2 max-h-[360px] overflow-auto rounded-md bg-muted/40 p-3 text-xs">
                            {formatJson(row.after_json)}
                          </pre>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
