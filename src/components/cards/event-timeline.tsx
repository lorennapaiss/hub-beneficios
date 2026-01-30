"use client";

import { useMemo, useState } from "react";
import type { EventRow } from "@/server/events";
import { Button } from "@/components/ui/button";

type TimelineProps = {
  events: EventRow[];
};

const EVENT_LABELS: Record<string, string> = {
  CARD_CREATED: "Cartao criado",
  CARD_UPDATED: "Cartao atualizado",
  LOAD_CREATED: "Carga registrada",
  ALLOCATED: "Cartao alocado",
  DEALLOCATED: "Alocação encerrada",
  ATTACHMENT_ADDED: "Anexo adicionado",
  STATUS_CHANGED: "Status alterado",
  TRANSFERRED: "Cartao transferido",
};

const periodOptions = [
  { value: "all", label: "Todo período" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
];

const getPeriodStart = (days: number) => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - days);
  return start;
};

const safeJson = (payload?: string) => {
  if (!payload) return null;
  try {
    return JSON.parse(payload) as any;
  } catch {
    return null;
  }
};

const getSummary = (event: EventRow) => {
  const label = EVENT_LABELS[event.event_type] ?? event.event_type;
  const payload = safeJson(event.payload_json);

  if (!payload) return label;

  switch (event.event_type) {
    case "CARD_CREATED":
      return `${label} (${payload?.card?.numero_cartao ?? "sem numero"})`;
    case "CARD_UPDATED":
      return `${label}`;
    case "LOAD_CREATED":
      return `${label} (R$ ${payload?.load?.valor_carga ?? "-"})`;
    case "ALLOCATED":
      return `${label}`;
    case "DEALLOCATED":
      return `${label}`;
    case "ATTACHMENT_ADDED":
      return `${label} (${payload?.type ?? "anexo"})`;
    case "STATUS_CHANGED":
      return `${label}`;
    case "TRANSFERRED":
      return `${label}`;
    default:
      return label;
  }
};

export function EventTimeline({ events }: TimelineProps) {
  const [eventType, setEventType] = useState("all");
  const [period, setPeriod] = useState("all");
  const [openIds, setOpenIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let result = events;

    if (eventType !== "all") {
      result = result.filter((event) => event.event_type === eventType);
    }

    if (period !== "all") {
      const days = Number(period);
      const start = getPeriodStart(days);
      result = result.filter((event) => {
        const date = new Date(event.event_date);
        return !Number.isNaN(date.getTime()) && date >= start;
      });
    }

    return result;
  }, [events, eventType, period]);

  const toggleDetails = (eventId: string) => {
    setOpenIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={eventType}
          onChange={(event) => setEventType(event.target.value)}
        >
          <option value="all">Todos os tipos</option>
          {Object.keys(EVENT_LABELS).map((type) => (
            <option key={type} value={type}>
              {EVENT_LABELS[type]}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          Nenhum evento encontrado para o filtro selecionado.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => {
            const isOpen = openIds.includes(event.event_id);
            const payload = safeJson(event.payload_json);
            return (
              <div
                key={event.event_id}
                className="rounded-lg border border-border px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {getSummary(event)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {event.event_date} · {event.created_by || "unknown"}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleDetails(event.event_id)}
                  >
                    {isOpen ? "Ocultar detalhes" : "Ver detalhes"}
                  </Button>
                </div>
                {isOpen ? (
                  <pre className="mt-3 overflow-auto rounded-md bg-muted/40 p-3 text-xs text-foreground">
                    {payload ? JSON.stringify(payload, null, 2) : "Sem detalhes."}
                  </pre>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
