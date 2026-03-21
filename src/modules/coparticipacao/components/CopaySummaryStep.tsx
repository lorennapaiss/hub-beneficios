import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyBR } from "@/modules/coparticipacao/utils/currency";
import type { ProcessingSummary } from "@/modules/coparticipacao/types/copay.types";

type CopaySummaryStepProps = {
  summary: ProcessingSummary;
};

const summaryCards = (summary: ProcessingSummary) => [
  { label: "Total de lancamentos", value: String(summary.total) },
  { label: "Aprovados", value: String(summary.aprovados) },
  { label: "Pendencias", value: String(summary.pendencias) },
  { label: "Valor aprovado", value: formatCurrencyBR(summary.valor_total_aprovado) },
];

export function CopaySummaryStep({ summary }: CopaySummaryStepProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCards(summary).map((card) => (
        <Card key={card.label}>
          <CardHeader>
            <CardTitle className="text-base">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
