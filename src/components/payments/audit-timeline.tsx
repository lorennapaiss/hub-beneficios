"use client";

import { useMemo } from "react";
import { format } from "date-fns";

export type AuditLogItem = {
  id: string;
  action?: string;
  actor_email?: string;
  actor_role?: string;
  created_at?: string;
  before?: string;
  after?: string;
  metadata?: string;
};

const safeParse = (value?: string) => {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, any>;
  } catch {
    return null;
  }
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd/MM/yyyy HH:mm");
  } catch {
    return value;
  }
};

const describeChange = (log: AuditLogItem) => {
  const before = safeParse(log.before);
  const after = safeParse(log.after);
  if (!before || !after) return "";

  if (before.status && after.status && before.status != after.status) {
    return `Status: ${before.status} -> ${after.status}`;
  }

  if (before.drive_link != after.drive_link && after.drive_link) {
    return "Boleto atualizado";
  }

  return "Atualização registrada";
};

export default function AuditTimeline({ logs }: { logs: AuditLogItem[] }) {
  const items = useMemo(
    () =>
      logs
        .filter((log) => log.created_at)
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")),
    [logs],
  );

  if (items.length == 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((event) => (
        <div key={event.id} className="flex gap-3">
          <div className="mt-2 h-2 w-2 rounded-full bg-primary" />
          <div className="rounded-md border bg-card px-4 py-3">
            <p className="text-sm font-medium">{event.action ?? "UPDATE"}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(event.created_at)} ? {event.actor_email ?? "-"} ? {event.actor_role ?? "USER"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {describeChange(event)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
