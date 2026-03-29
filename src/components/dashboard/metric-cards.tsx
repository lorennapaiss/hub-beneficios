type Metric = {
  label: string;
  value: string;
};

export default function MetricCards({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="kpi-card">
          <p className="page-stat-label">{metric.label}</p>
          <p className="mt-3 page-stat-value">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}
