"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import StatusBadge from "@/components/payments/status-badge";
import AuditTimeline, { type AuditLogItem } from "@/components/payments/audit-timeline";
import PaymentForm from "@/components/payments/payment-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useApi } from "@/lib/hooks/use-api";

export default function PaymentDetailPage() {
  const params = useParams();
  const paymentId = String(params?.id ?? "");
  const { request } = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payment, setPayment] = useState<any>(null);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);

  const load = useCallback(async () => {
    if (!paymentId) return;
    setLoading(true);
    try {
      const [paymentResponse, auditResponse] = await Promise.all([
        request<{ data: any }>(`/api/payments/${paymentId}`),
        request<{ data: AuditLogItem[] }>(`/api/audit?payment_id=${paymentId}`),
      ]);
      setPayment(paymentResponse.data);
      setLogs(auditResponse.data);
    } finally {
      setLoading(false);
    }
  }, [paymentId, request]);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      await load();
    };

    if (mounted) {
      fetchData();
    }

    return () => {
      mounted = false;
    };
  }, [load]);

  const handleAction = async (action: "mark-sent" | "mark-paid") => {
    if (!paymentId) return;
    setSaving(true);
    try {
      await request(`/api/payments/${paymentId}/${action}`, { method: "POST" });
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  if (!payment) {
    return (
      <p className="text-sm text-muted-foreground">Pagamento nao encontrado.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{payment.id}</h1>
            <StatusBadge status={payment.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {payment.category} · {payment.brand ?? "-"} · {payment.provider} · Competência {payment.competence}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-muted text-foreground hover:bg-muted/80"
            onClick={() => handleAction("mark-sent")}
            disabled={saving}
          >
            Marcar aguardando
          </Button>
          <Button onClick={() => handleAction("mark-paid")} disabled={saving}>
            Marcar como pago
          </Button>
          <Button
            className="bg-muted text-foreground hover:bg-muted/80"
            disabled={!payment.drive_link}
            onClick={() => payment.drive_link && window.open(payment.drive_link, "_blank")}
          >
            Abrir boleto
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Responsavel</p>
            <p className="text-sm font-medium">{payment.owner_name}</p>
            <p className="text-xs text-muted-foreground">{payment.owner_email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor</p>
            <p className="text-sm font-medium">{payment.amount ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Marca</p>
            <p className="text-sm font-medium">{payment.brand ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vencimento</p>
            <p className="text-sm font-medium">{payment.due_date}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ticket</p>
            <p className="text-sm font-medium">{payment.ticket_number}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Boleto</p>
            <p className="text-sm font-medium">
              {payment.drive_filename ?? "Sem boleto"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <StatusBadge status={payment.status} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Historico</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditTimeline logs={logs} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Editar</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentForm mode="edit" paymentId={paymentId} initialValues={payment} />
          </CardContent>
        </Card>
      </div>

      <Separator />
    </div>
  );
}
