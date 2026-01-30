import "server-only";

import { getRowsCached } from "@/server/sheets";

export type AuditRow = {
  audit_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  before_json: string;
  after_json: string;
  created_at: string;
  created_by: string;
};

type AuditFilters = {
  entity_type?: string;
  action?: string;
  created_by?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export const listAuditLogs = async ({
  entity_type,
  action,
  created_by,
  from,
  to,
  limit = 20,
  offset = 0,
}: AuditFilters) => {
  const rows = (await getRowsCached("audit_log")) as AuditRow[];
  let result = rows;

  if (entity_type) {
    result = result.filter((row) => row.entity_type === entity_type);
  }
  if (action) {
    result = result.filter((row) => row.action === action);
  }
  if (created_by) {
    const term = created_by.toLowerCase();
    result = result.filter((row) => row.created_by.toLowerCase().includes(term));
  }
  if (from) {
    result = result.filter((row) => row.created_at >= from);
  }
  if (to) {
    result = result.filter((row) => row.created_at <= to);
  }

  result = result.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const total = result.length;
  const start = Math.max(offset, 0);
  const end = start + Math.max(limit, 0);
  const page = result.slice(start, end);

  return { rows: page, total };
};
