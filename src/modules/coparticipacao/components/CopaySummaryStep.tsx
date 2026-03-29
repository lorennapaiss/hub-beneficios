import { formatCurrencyBR } from "@/modules/coparticipacao/utils/currency";
import type { ProcessingSummary } from "@/modules/coparticipacao/types/copay.types";

type CopaySummaryStepProps = {
  summary: ProcessingSummary;
};

const summaryCards = (summary: ProcessingSummary) => [
  { label: "Total de lançamentos", value: String(summary.total) },
  { label: "Aprovados", value: String(summary.aprovados) },
  { label: "Pendências", value: String(summary.pendencias) },
  { label: "Valor aprovado", value: formatCurrencyBR(summary.valor_total_aprovado) },
];

export function CopaySummaryStep({ summary }: CopaySummaryStepProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCards(summary).map((card) => (
        <div key={card.label} className="kpi-card">
          <p className="page-stat-label">{card.label}</p>
          <p className="mt-3 page-stat-value">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
