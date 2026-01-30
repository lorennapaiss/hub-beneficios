import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, isAdminEmail } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { listAuditLogs } from "@/server/audit";
import { AdminTabs } from "@/components/admin/admin-tabs";

export const dynamic = "force-dynamic";
export const revalidate = 0;


type SearchParams = {
  entity_type?: string;
  action?: string;
  created_by?: string;
  period?: string;
  limit?: string;
  offset?: string;
  tab?: string;
};

const toNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const getPeriodFrom = (period?: string) => {
  if (!period || period === "all") return undefined;
  const days = Number(period);
  if (Number.isNaN(days)) return undefined;
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - days);
  return start.toISOString();
};

const getEnvStatus = () => {
  const env = process.env;
  return [
    { label: "GOOGLE_CLIENT_ID", ok: Boolean(env.GOOGLE_CLIENT_ID) },
    { label: "GOOGLE_CLIENT_SECRET", ok: Boolean(env.GOOGLE_CLIENT_SECRET) },
    { label: "NEXTAUTH_SECRET", ok: Boolean(env.NEXTAUTH_SECRET) },
    { label: "ALLOWED_EMAILS/ALLOWED_DOMAIN", ok: Boolean(env.ALLOWED_EMAILS || env.ALLOWED_DOMAIN) },
    { label: "ADMIN_EMAILS", ok: Boolean(env.ADMIN_EMAILS) },
    { label: "SHEETS_SPREADSHEET_ID", ok: Boolean(env.SHEETS_SPREADSHEET_ID) },
    { label: "GOOGLE_SERVICE_ACCOUNT_EMAIL", ok: Boolean(env.GOOGLE_SERVICE_ACCOUNT_EMAIL) },
    { label: "GOOGLE_PRIVATE_KEY", ok: Boolean(env.GOOGLE_PRIVATE_KEY) },
    { label: "DRIVE_FOLDER_ID", ok: Boolean(env.DRIVE_FOLDER_ID) },
    { label: "PAYMENTS_SHEETS_ID", ok: Boolean(env.PAYMENTS_SHEETS_ID) },
    { label: "PAYMENTS_DRIVE_FOLDER_ID", ok: Boolean(env.PAYMENTS_DRIVE_FOLDER_ID) },
    { label: "LOW_BALANCE_THRESHOLD", ok: Boolean(env.LOW_BALANCE_THRESHOLD) },
    { label: "ENABLE_SEED", ok: Boolean(env.ENABLE_SEED) },
  ];
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const limit = toNumber(resolvedParams.limit, 20);
  const offset = toNumber(resolvedParams.offset, 0);
  const period = resolvedParams.period ?? "all";
  const from = getPeriodFrom(period);

  const audit = await listAuditLogs({
    entity_type: resolvedParams.entity_type,
    action: resolvedParams.action,
    created_by: resolvedParams.created_by,
    from,
    limit,
    offset,
  });

  const defaultTab = resolvedParams.tab === "config" ? "config" : "audit";
  const envStatus = getEnvStatus();

  return (
    <div className="space-y-6">
      <PageHeader title="Admin" description="Auditoria e configurações." />
      <AdminTabs
        defaultTab={defaultTab}
        auditRows={audit.rows}
        auditTotal={audit.total}
        limit={limit}
        offset={offset}
        filters={{
          entity_type: resolvedParams.entity_type,
          action: resolvedParams.action,
          created_by: resolvedParams.created_by,
          period,
        }}
        envStatus={envStatus}
      />
    </div>
  );
}
