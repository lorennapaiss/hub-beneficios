"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FormState = {
  faturas_sulamerica_base_folder_id: string;
  competencia_folder_pattern: string;
};

const defaultForm: FormState = {
  faturas_sulamerica_base_folder_id: "",
  competencia_folder_pattern: "YYYY-MM",
};

export function FaturasConfig() {
  const { request } = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await request<{ data: Partial<FormState> }>(
          "/api/config",
        );
        if (mounted) {
          setForm({
            ...defaultForm,
            ...response.data,
          });
        }
      } catch {
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

  const updateField = (key: keyof FormState, value: string) => {
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
          Apenas administradores podem editar estas informações.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pastas de faturas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="faturas-base">Pasta base (SulAmérica)</Label>
            <Input
              id="faturas-base"
              value={form.faturas_sulamerica_base_folder_id}
              onChange={(event) =>
                updateField("faturas_sulamerica_base_folder_id", event.target.value)
              }
              placeholder="ID da pasta base no Drive"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="competencia-pattern">
              Padrão de nome da pasta de competência
            </Label>
            <Input
              id="competencia-pattern"
              value={form.competencia_folder_pattern}
              onChange={(event) =>
                updateField("competencia_folder_pattern", event.target.value)
              }
              placeholder="YYYY-MM"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </div>
  );
}
