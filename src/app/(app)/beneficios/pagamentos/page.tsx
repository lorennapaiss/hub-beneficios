"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, isWithinInterval, parseISO } from "date-fns";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import MetricCards from "@/components/dashboard/metric-cards";
import PaymentsTable from "@/components/payments/payments-table";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/use-api";
import { computeAutoStatus } from "@/lib/schema";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const getCurrentCompetence = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
};

type PaymentRow = {
  id: string;
  category?: string;
  brand?: string;
  provider?: string;
  competence?: string;
  amount?: number;
  due_date?: string;
  status?: string;
  owner_name?: string;
  owner_email?: string;
  ticket_number?: string;
};

export default function DashboardPage() {
  const { request } = useApi();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const patchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem("patchedOverdueIds");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[];
        patchedRef.current = new Set(parsed);
      } catch {
        patchedRef.current = new Set();
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const persistOverdue = async (rows: PaymentRow[]) => {
      const updatedIds: string[] = [];

      for (const row of rows) {
        if (!row.id || !row.due_date || !row.status) continue;
        const autoStatus = computeAutoStatus(row.due_date, row.status);
        const shouldPatch =
          autoStatus === "ATRASADO" &&
          row.status !== "ATRASADO" &&
          row.status !== "PAGO" &&
          !patchedRef.current.has(row.id);

        if (!shouldPatch) continue;

        try {
          await request(`/api/payments/${row.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "ATRASADO" }),
          });
          patchedRef.current.add(row.id);
          updatedIds.push(row.id);
        } catch {
          // Toast já é tratado no hook.
        }
      }

      if (updatedIds.length > 0) {
        localStorage.setItem(
          "patchedOverdueIds",
          JSON.stringify(Array.from(patchedRef.current))
        );
      }
    };

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await request<{ data: PaymentRow[] }>("/api/payments");
        const computed = response.data.map((row) => ({
          ...row,
          status: computeAutoStatus(row.due_date, row.status),
        }));

        if (mounted) {
          setPayments(computed);
        }

        await persistOverdue(response.data);
      } catch (error) {
        if (mounted) {
          setPayments([]);
          setError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os pagamentos."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [request]);

  const metrics = useMemo(() => {
    const now = new Date();
    const nextWeek = addDays(now, 7);
    const competence = getCurrentCompetence();

    const venceEm7 = payments.filter((payment) => {
      if (!payment.due_date) return false;
      if (payment.status === "PAGO") return false;
      const due = parseISO(payment.due_date);
      return isWithinInterval(due, { start: now, end: nextWeek });
    });

    const atrasados = payments.filter((payment) => payment.status === "ATRASADO");
    const aguardando = payments.filter(
      (payment) => payment.status === "AGUARDANDO_PAGAMENTO"
    );
    const pagosNoMes = payments.filter(
      (payment) => payment.status === "PAGO" && payment.competence === competence
    );

    const totalPagoMes = pagosNoMes.reduce(
      (sum, payment) => sum + (payment.amount ?? 0),
      0
    );

    return [
      { label: "Vence em 7 dias", value: String(venceEm7.length) },
      { label: "Atrasados", value: String(atrasados.length) },
      { label: "Aguardando pagamento", value: String(aguardando.length) },
      { label: "Pagos no mês", value: currencyFormatter.format(totalPagoMes) },
    ];
  }, [payments]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 animate-pulse rounded-3xl border border-border/70 bg-muted/40" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-3xl border border-border/70 bg-card"
            />
          ))}
        </div>
        <div className="h-[28rem] animate-pulse rounded-3xl border border-border/70 bg-card" />
      </div>
    );
  }

  return (
    <div className="page-section">
      <PageHeader
        eyebrow="Financeiro de benefícios"
        title="Pagamentos"
        description="Acompanhe vencimentos, gargalos e evolução financeira do processo de pagamento em um único fluxo."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/beneficios/pagamentos/config">Configurar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/beneficios/pagamentos/new">Novo pagamento</Link>
            </Button>
          </>
        }
      />

      {error ? (
        <div className="rounded-3xl border border-destructive/25 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-semibold">Falha ao carregar pagamentos</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Resumo executivo</h2>
            <p className="text-sm text-muted-foreground">
              Monitoramento de SLA, caixa e pagamentos processados.
            </p>
          </div>
          <Badge className="bg-background">{payments.length} pagamentos</Badge>
        </div>
        <MetricCards metrics={metrics} />
      </section>

      <PaymentsTable rows={payments} />
    </div>
  );
}
