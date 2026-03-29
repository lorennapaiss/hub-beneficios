"use client";

import { useId } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MONTHS_PT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function parseLabel(label: string): string {
  if (label.includes("-")) {
    const [year, month] = label.split("-");
    const m = parseInt(month) - 1;
    return `${MONTHS_PT[m] ?? label}/${String(year).slice(2)}`;
  }
  const m = parseInt(label) - 1;
  return MONTHS_PT[m] ?? label;
}

function TooltipContent({
  active,
  payload,
  label,
  formatValue,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  formatValue?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">
        {formatValue ? formatValue(val) : String(val)}
      </p>
    </div>
  );
}

export interface TrendChartProps {
  title: string;
  data: Array<{ label: string; value: number }>;
  type?: "area" | "line";
  formatValue?: (v: number) => string;
  color?: string;
  secondaryColor?: string;
  height?: number;
  className?: string;
}

export function TrendChart({
  title,
  data,
  type = "area",
  formatValue,
  color = "#4DBFB3",
  height = 200,
  className,
}: TrendChartProps) {
  const uid = useId();
  const gradId = `tc-grad-${uid.replace(/:/g, "")}`;
  const chartData = data.map((d) => ({ name: parseLabel(d.label), value: d.value }));

  const empty = (
    <div
      style={{ height }}
      className="flex items-center justify-center text-sm text-muted-foreground"
    >
      Sem dados para exibir.
    </div>
  );

  const xAxis = (
    <XAxis
      dataKey="name"
      tick={{ fontSize: 11, fill: "#9ca3af" }}
      axisLine={false}
      tickLine={false}
      dy={6}
    />
  );

  const grid = (
    <CartesianGrid
      strokeDasharray="4 4"
      stroke="#e5e7eb"
      strokeOpacity={0.8}
      vertical={false}
    />
  );

  const tooltip = (
    <Tooltip
      content={<TooltipContent formatValue={formatValue} />}
      cursor={{ stroke: color, strokeWidth: 1, strokeOpacity: 0.3 }}
    />
  );

  return (
    <section className={`rounded-xl border border-border bg-card p-5 ${className ?? ""}`}>
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      {chartData.length === 0 ? (
        empty
      ) : type === "area" ? (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="10%" stopColor={color} stopOpacity={0.18} />
                <stop offset="90%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            {grid}
            {xAxis}
            <YAxis hide domain={["auto", "auto"]} />
            {tooltip}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            {grid}
            {xAxis}
            <YAxis hide domain={["auto", "auto"]} />
            {tooltip}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
