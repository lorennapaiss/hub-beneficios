"use client";

import { useState } from "react";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type BenefitKey = "health" | "dental" | "transport" | "meal";

type AiInsightsBoxProps = {
  benefit: BenefitKey;
  context: Record<string, unknown>;
};

export function AiInsightsBox({ benefit, context }: AiInsightsBoxProps) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState("");
  const [provider, setProvider] = useState<"gemini" | "local" | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [error, setError] = useState("");

  const generateInsights = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/indicators/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ benefit, context }),
      });

      const payload = (await response.json()) as {
        data?: {
          insight?: string;
          provider?: "gemini" | "local";
          reason?: string;
          model?: string;
          availableModelCount?: number;
        };
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Nao foi possivel gerar insights agora.");
        return;
      }

      setInsight(payload.data?.insight ?? "Sem insights para exibir.");
      setProvider(payload.data?.provider ?? null);
      setModel(payload.data?.model ?? null);
      setReason(payload.data?.reason ?? null);
    } catch {
      setError("Falha de conexao ao gerar insights.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#4DBFB3]/30 bg-[#4DBFB3]/10 text-[#0C3B6F]">
            <Brain className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Insights com IA</h3>
            <p className="text-xs text-muted-foreground">
              Análise contextual do recorte atual do dashboard.
            </p>
          </div>
        </div>
        <Button type="button" onClick={generateInsights} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Gerando..." : "Gerar insights"}
        </Button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      {insight ? (
        <div className="mt-3 rounded-xl border border-border bg-muted/40 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Resultado{" "}
            {provider
              ? `(${provider === "gemini" ? `IA${model ? ` - ${model}` : ""}` : "local"})`
              : ""}
          </p>
          <pre className="whitespace-pre-wrap text-sm leading-6 text-foreground">{insight}</pre>
          {provider === "local" && reason ? (
            <p className="mt-2 text-xs text-amber-700">
              Observacao tecnica: fallback local ativo ({reason}).
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          Clique em &quot;Gerar insights&quot; para receber uma leitura executiva desta visualizacao.
        </p>
      )}
    </section>
  );
}
