import type { PjSummary } from "@/server/pjs";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function PjSummaryCards({ summary }: { summary: PjSummary }) {
  const items = [
    { label: "PJs ativos", value: String(summary.ativos) },
    { label: "Pendências documentais", value: String(summary.pendenciasDocumentais) },
    { label: "Alocação incompleta", value: String(summary.alocacaoIncompleta) },
    { label: "Custo mensal total", value: formatCurrency(summary.custoTotalMensal) },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="kpi-card">
          <p className="page-stat-label">{item.label}</p>
          <p className="mt-3 page-stat-value">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
