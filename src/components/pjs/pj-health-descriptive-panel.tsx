"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HistoryItem = {
  pj_descritivo_geracao_id: string;
  competencia: string;
  versao: string;
  total_devido: string;
  arquivo_nome: string;
  generated_at: string;
  generated_by: string;
};

type PreviewLine = {
  beneficiario: string;
  tipo: string;
  vinculoDependente: string;
  mensalidade: number;
  subsidioEmpresa: number;
  coparticipacao: number;
  valorDevido: number;
};

type PreviewData = {
  competencia: string;
  competenciaLabel: string;
  arquivoNome: string;
  empresa: {
    razaoSocial: string;
    cnpj: string;
    endereco: string;
    cep: string;
  };
  prestador: {
    nome: string;
    cpf: string;
    cnpj: string;
  };
  textoIntrodutorio: string;
  observacoes: string[];
  linhas: PreviewLine[];
  totais: {
    totalPlano: number;
    totalSubsidio: number;
    totalCoparticipacao: number;
    totalDevido: number;
  };
  inconsistencias: string[];
  bloqueado: boolean;
  historico: HistoryItem[];
};

const inputClassName =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);

export function PjHealthDescriptivePanel({
  pjId,
  history,
}: {
  pjId: string;
  history: HistoryItem[];
}) {
  const [competencia, setCompetencia] = useState(() => new Date().toISOString().slice(0, 7));
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mergedHistory = preview?.historico ?? history;

  const loadPreview = async () => {
    setIsLoading(true);
    setError(null);

    const response = await fetch(`/api/pjs/${pjId}/descritivo?competencia=${competencia}`);
    const payload = await response.json();

    setIsLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Erro ao carregar previa.");
      return;
    }

    setPreview(payload.data);
  };

  const generate = async () => {
    setIsGenerating(true);
    setError(null);

    const response = await fetch(`/api/pjs/${pjId}/descritivo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competencia }),
    });
    const payload = await response.json();

    setIsGenerating(false);
    if (!response.ok) {
      setError(payload.error ?? "Erro ao gerar descritivo.");
      return;
    }

    setPreview(payload.data);
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-base">Descritivo de desconto do plano de saude</CardTitle>
        <p className="text-sm text-muted-foreground">
          Usa os itens mensais da aba <code>pj_descritivo_itens</code>, aplica as regras da aba{" "}
          <code>pj_descritivo_config</code> e registra a geracao em{" "}
          <code>pj_descritivo_geracoes</code>.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-[220px_auto_auto]">
          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>Competencia</span>
            <input
              className={inputClassName}
              type="month"
              value={competencia}
              onChange={(event) => setCompetencia(event.target.value)}
            />
          </label>
          <div className="flex items-end gap-3">
            <Button type="button" variant="outline" onClick={loadPreview} disabled={isLoading}>
              {isLoading ? "Carregando..." : "Carregar previa"}
            </Button>
            <Button type="button" onClick={generate} disabled={isGenerating}>
              {isGenerating ? "Gerando..." : "Gerar e registrar"}
            </Button>
          </div>
          <div className="flex items-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={!preview}
              onClick={() =>
                window.open(`/pjs/${pjId}/descritivo?competencia=${competencia}`, "_blank")
              }
            >
              Versao imprimivel
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {preview ? (
          <div className="space-y-4 rounded-xl border border-border/70 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Prestador
                </div>
                <div className="text-sm font-medium">{preview.prestador.nome}</div>
                <div className="text-sm text-muted-foreground">
                  CPF {preview.prestador.cpf} | CNPJ {preview.prestador.cnpj}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Competencia
                </div>
                <div className="text-sm font-medium">{preview.competenciaLabel}</div>
                <div className="text-sm text-muted-foreground">{preview.arquivoNome}</div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{preview.textoIntrodutorio}</p>

            {preview.inconsistencias.length > 0 ? (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm text-amber-900">
                {preview.inconsistencias.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            ) : null}

            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Beneficiario</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Plano</th>
                    <th className="px-4 py-3 font-medium">Subsidio</th>
                    <th className="px-4 py-3 font-medium">Coparticipacao</th>
                    <th className="px-4 py-3 font-medium">Valor devido</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.linhas.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-muted-foreground" colSpan={6}>
                        Nenhum beneficiario elegivel para a competencia.
                      </td>
                    </tr>
                  ) : (
                    preview.linhas.map((linha) => (
                      <tr key={`${linha.beneficiario}-${linha.tipo}`} className="border-b border-border">
                        <td className="px-4 py-3">{linha.beneficiario}</td>
                        <td className="px-4 py-3">
                          {linha.tipo}
                          {linha.vinculoDependente ? ` - ${linha.vinculoDependente}` : ""}
                        </td>
                        <td className="px-4 py-3">{formatCurrency(linha.mensalidade)}</td>
                        <td className="px-4 py-3">{formatCurrency(linha.subsidioEmpresa)}</td>
                        <td className="px-4 py-3">{formatCurrency(linha.coparticipacao)}</td>
                        <td className="px-4 py-3 font-medium">
                          {formatCurrency(linha.valorDevido)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <Metric label="Total plano" value={formatCurrency(preview.totais.totalPlano)} />
              <Metric label="Total subsidio" value={formatCurrency(preview.totais.totalSubsidio)} />
              <Metric
                label="Total coparticipacao"
                value={formatCurrency(preview.totais.totalCoparticipacao)}
              />
              <Metric
                label="Total a descontar"
                value={formatCurrency(preview.totais.totalDevido)}
                emphasized
              />
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              {preview.observacoes.map((item) => (
                <div key={item}>* {item}</div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="text-sm font-semibold text-foreground">Historico de geracao</div>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Competencia</th>
                  <th className="px-4 py-3 font-medium">Versao</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Gerado em</th>
                  <th className="px-4 py-3 font-medium">Arquivo</th>
                </tr>
              </thead>
              <tbody>
                {mergedHistory.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-muted-foreground" colSpan={5}>
                      Nenhuma geracao registrada.
                    </td>
                  </tr>
                ) : (
                  mergedHistory.map((item) => (
                    <tr key={item.pj_descritivo_geracao_id} className="border-b border-border">
                      <td className="px-4 py-3">{item.competencia}</td>
                      <td className="px-4 py-3">v{item.versao}</td>
                      <td className="px-4 py-3">{formatCurrency(item.total_devido)}</td>
                      <td className="px-4 py-3">
                        {new Date(item.generated_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">{item.arquivo_nome}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/70 p-3">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className={emphasized ? "text-lg font-semibold text-foreground" : "text-sm font-medium"}>
        {value}
      </div>
    </div>
  );
}
