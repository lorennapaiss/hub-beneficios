"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditTable } from "@/components/admin/audit-table";
import { Button } from "@/components/ui/button";
import type { AuditRow } from "@/server/audit";

type AdminTabsProps = {
  defaultTab: "audit" | "config";
  auditRows: AuditRow[];
  auditTotal: number;
  limit: number;
  offset: number;
  filters: {
    entity_type?: string;
    action?: string;
    created_by?: string;
    period?: string;
  };
  envStatus: { label: string; ok: boolean }[];
};

const ENTITY_TYPES = [
  "card",
  "person",
  "allocation",
  "load",
  "attachment",
  "event",
  "audit",
];

const ACTIONS = ["CREATE", "UPDATE", "DELETE"];

const PERIODS = [
  { value: "all", label: "Todo período" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
];

export function AdminTabs({
  defaultTab,
  auditRows,
  auditTotal,
  limit,
  offset,
  filters,
  envStatus,
}: AdminTabsProps) {
  const [tab, setTab] = useState<"audit" | "config">(defaultTab);
  const totalPages = Math.max(Math.ceil(auditTotal / limit), 1);
  const currentPage = Math.floor(offset / limit) + 1;

  const paginationLinks = useMemo(() => {
    const createLink = (nextOffset: number) => {
      const params = new URLSearchParams();
      if (filters.entity_type) params.set("entity_type", filters.entity_type);
      if (filters.action) params.set("action", filters.action);
      if (filters.created_by) params.set("created_by", filters.created_by);
      if (filters.period) params.set("period", filters.period);
      params.set("limit", String(limit));
      params.set("offset", String(nextOffset));
      params.set("tab", tab);
      return `/admin?${params.toString()}`;
    };

    return {
      prev: createLink(Math.max(offset - limit, 0)),
      next: createLink(offset + limit),
    };
  }, [filters, limit, offset, tab]);

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as "audit" | "config")}>
      <TabsList className="w-fit">
        <TabsTrigger value="audit">Auditoria</TabsTrigger>
        <TabsTrigger value="config">Config</TabsTrigger>
      </TabsList>

      <TabsContent value="audit" className="space-y-6">
        <form
          method="get"
          className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-5"
        >
          <input type="hidden" name="tab" value="audit" />
          <select
            name="entity_type"
            defaultValue={filters.entity_type ?? ""}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Entidade</option>
            {ENTITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            name="action"
            defaultValue={filters.action ?? ""}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Ação</option>
            {ACTIONS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <input
            name="created_by"
            placeholder="Usuário"
            defaultValue={filters.created_by ?? ""}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            name="period"
            defaultValue={filters.period ?? "all"}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {PERIODS.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <Button type="submit">Filtrar</Button>
        </form>

        <AuditTable rows={auditRows} />

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            Página {currentPage} de {totalPages} · {auditTotal} registros
          </span>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              disabled={offset <= 0}
              className="disabled:pointer-events-none disabled:opacity-50"
            >
              <a href={paginationLinks.prev}>Anterior</a>
            </Button>
            <Button
              asChild
              variant="outline"
              disabled={offset + limit >= auditTotal}
              className="disabled:pointer-events-none disabled:opacity-50"
            >
              <a href={paginationLinks.next}>Próxima</a>
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="config">
        <div className="grid gap-3 rounded-lg border border-border bg-card p-4 text-sm">
          {envStatus.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span>{item.label}</span>
              <span
                className={
                  item.ok ? "text-emerald-600" : "text-destructive"
                }
              >
                {item.ok ? "OK" : "MISSING"}
              </span>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
