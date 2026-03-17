import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PjSummary } from "@/server/pjs";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function PjSummaryCards({ summary }: { summary: PjSummary }) {
  const items = [
    { label: "PJs ativos", value: String(summary.ativos) },
    { label: "Pendencias documentais", value: String(summary.pendenciasDocumentais) },
    { label: "Alocacao incompleta", value: String(summary.alocacaoIncompleta) },
    { label: "Custo mensal total", value: formatCurrency(summary.custoTotalMensal) },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
