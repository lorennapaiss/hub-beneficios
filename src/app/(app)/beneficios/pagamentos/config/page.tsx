"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PROVIDERS = ["Unimed", "SulAmerica", "Amil", "Outro"];
const CATEGORIES = ["PlanoSaude", "VT", "VA", "ExameOcupacional"];

export default function ConfigPage() {
  const { request } = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    root_drive_folder_id: "",
    team_emails: "",
    reminder_d3_enabled: true,
    reminder_d1_enabled: true,
    reminder_d0_enabled: true,
    reminder_overdue_enabled: true,
    reminder_overdue_every_days: 1,
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await request<{ data: typeof form }>("/api/config");
        if (mounted) {
          setForm({
            ...form,
            ...response.data,
          });
        }
      } catch (err) {
        if (mounted) setError("Acesso restrito a administradores.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [request]);

  const updateField = (key: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await request("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  if (error) {
    return <p className="text-sm text-muted-foreground">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Apenas administradores podem editar estas informacoes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Integracoes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Root Folder ID (Drive)</Label>
              <Input
                value={form.root_drive_folder_id}
                onChange={(event) =>
                  updateField("root_drive_folder_id", event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Team Emails (CC)</Label>
              <Textarea
                value={form.team_emails}
                onChange={(event) => updateField("team_emails", event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regras de lembretes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Habilitar D-3</Label>
              <input
                type="checkbox"
                checked={form.reminder_d3_enabled}
                onChange={(event) =>
                  updateField("reminder_d3_enabled", event.target.checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Habilitar D-1</Label>
              <input
                type="checkbox"
                checked={form.reminder_d1_enabled}
                onChange={(event) =>
                  updateField("reminder_d1_enabled", event.target.checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Habilitar D0</Label>
              <input
                type="checkbox"
                checked={form.reminder_d0_enabled}
                onChange={(event) =>
                  updateField("reminder_d0_enabled", event.target.checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Habilitar OVERDUE</Label>
              <input
                type="checkbox"
                checked={form.reminder_overdue_enabled}
                onChange={(event) =>
                  updateField("reminder_overdue_enabled", event.target.checked)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Frequencia pos-vencimento (dias)</Label>
              <Input
                type="number"
                value={form.reminder_overdue_every_days}
                onChange={(event) =>
                  updateField(
                    "reminder_overdue_every_days",
                    Number(event.target.value),
                  )
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listas fixas (MVP)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Provedores</Label>
            <ul className="mt-2 list-disc pl-6 text-sm text-muted-foreground">
              {PROVIDERS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <Label>Categorias</Label>
            <ul className="mt-2 list-disc pl-6 text-sm text-muted-foreground">
              {CATEGORIES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar configuracoes"}
        </Button>
      </div>
    </div>
  );
}
