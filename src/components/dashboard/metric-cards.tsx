import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Metric = {
  label: string;
  value: string;
};

export default function MetricCards({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="subtle-ring">
          <CardHeader className="pb-3">
            <CardTitle className="page-stat-label">{metric.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {metric.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
