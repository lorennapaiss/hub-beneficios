"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, HandCoins, ShieldCheck, Users } from "lucide-react";
import { AiInsightsBox } from "@/components/indicators/ai-insights-box";
import { MultiFilter, matchesMulti } from "@/components/indicators/multi-filter";
import { TrendChart } from "@/components/indicators/trend-chart";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { classifyRole, ROLE_GROUPS } from "@/lib/role-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DentalRecord } from "@/server/indicators/dashboard";

type DentalDashboardProps = {
  records: DentalRecord[];
  mode?: "A" | "B" | "C";
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatCurrency = (value: number) => currency.format(value);
const formatCurrencyCompact = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `R$ ${(value / 1_000_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B`;
  if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  if (abs >= 1_000) return `R$ ${(value / 1_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K`;
  return formatCurrency(value);
};
const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);
const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;
const normalizePersonName = (value: string) => value.trim().toLowerCase();
const modeClass = (mode: "A" | "B" | "C") =>
  mode === "A" ? "indicator-layout-a" : mode === "C" ? "indicator-layout-c" : "indicator-layout-b";

export function DentalDashboard({ records, mode = "B" }: DentalDashboardProps) {
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [brand, setBrand] = useState("all");
  const [operator, setOperator] = useState("all");
  const [plan, setPlan] = useState("all");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedRoleGroups, setSelectedRoleGroups] = useState<string[]>([]);
  const [person, setPerson] = useState("");
  const [detailPage, setDetailPage] = useState(1);
  const detailPageSize = 25;
  const debouncedPerson = useDebouncedValue(person, 300);

  const options = useMemo(() => {
    const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean))).sort((a, b) => a.localeCompare(b));

    return {
      years: uniq(records.map((r) => String(r.year))).sort((a, b) => Number(b) - Number(a)),
      months: uniq(records.map((r) => String(r.month))).sort((a, b) => Number(a) - Number(b)),
      brands: uniq(records.map((r) => r.brand || "Nao informado")),
      operators: uniq(records.map((r) => r.operator || "Nao informado")),
      plans: uniq(records.map((r) => r.plan || "Nao informado")),
      roles: uniq(records.map((r) => r.role || "Nao informado")),
      roleGroups: [...ROLE_GROUPS],
    };
  }, [records]);

  const filtered = useMemo(() => {
    const query = debouncedPerson.trim().toLowerCase();

    return records.filter((row) => {
      if (year !== "all" && String(row.year) !== year) return false;
      if (month !== "all" && String(row.month) !== month) return false;
      if (brand !== "all" && (row.brand || "Nao informado") !== brand) return false;
      if (operator !== "all" && (row.operator || "Nao informado") !== operator) return false;
      if (plan !== "all" && (row.plan || "Nao informado") !== plan) return false;
      if (!matchesMulti(selectedRoles, row.role || "Nao informado")) return false;
      if (selectedRoleGroups.length > 0 && !selectedRoleGroups.includes(classifyRole(row.role || "Nao informado"))) return false;

      if (query) {
        const text = `${row.holderName} ${row.employeeName} ${row.employeeId}`.toLowerCase();
        if (!text.includes(query)) return false;
      }

      return true;
    });
  }, [records, year, month, brand, operator, plan, selectedRoles, selectedRoleGroups, debouncedPerson]);

  const metrics = useMemo(() => {
    const totalCost = sum(filtered.map((r) => r.amount));

    const activeLivesSet = new Set(
      filtered
        .map((r) => normalizePersonName(r.employeeName || ""))
        .filter((name) => name.length > 0),
    );
    const byMonthLives = new Map<string, Set<string>>();
    const byMonthHolders = new Map<string, Set<string>>();
    const byMonthCost = new Map<string, number>();

    const byBrandCost = new Map<string, number>();
    const byBrandLives = new Map<string, Set<string>>();
    const byBrandHolders = new Map<string, Set<string>>();

    for (const row of filtered) {
      const mk = monthKey(row.year, row.month);
      const lifeKey = normalizePersonName(row.employeeName || "");
      const holderKey = row.holderCpf || row.holderName;

      if (!byMonthLives.has(mk)) byMonthLives.set(mk, new Set<string>());
      if (!byMonthHolders.has(mk)) byMonthHolders.set(mk, new Set<string>());

      if (lifeKey.length > 0) byMonthLives.get(mk)?.add(lifeKey);
      if (holderKey) byMonthHolders.get(mk)?.add(holderKey);

      byMonthCost.set(mk, (byMonthCost.get(mk) ?? 0) + row.amount);

      const b = row.brand || "Nao informado";
      byBrandCost.set(b, (byBrandCost.get(b) ?? 0) + row.amount);
      if (!byBrandLives.has(b)) byBrandLives.set(b, new Set<string>());
      if (!byBrandHolders.has(b)) byBrandHolders.set(b, new Set<string>());
      if (lifeKey.length > 0) byBrandLives.get(b)?.add(lifeKey);
      if (holderKey) byBrandHolders.get(b)?.add(holderKey);
    }

    const monthKeys = Array.from(byMonthCost.keys()).sort((a, b) => a.localeCompare(b));

    const monthlyCost = monthKeys.map((mk) => ({ label: mk, value: byMonthCost.get(mk) ?? 0 }));

    const monthlyLife = monthKeys.map((mk) => ({ label: mk, value: byMonthLives.get(mk)?.size ?? 0 }));
    const monthlyHolder = monthKeys.map((mk) => ({ label: mk, value: byMonthHolders.get(mk)?.size ?? 0 }));

    const byBrandCostList = Array.from(byBrandCost.entries()).sort((a, b) => b[1] - a[1]);
    const byBrandLivesList = Array.from(byBrandLives.entries())
      .map(([label, set]) => [label, set.size] as const)
      .sort((a, b) => b[1] - a[1]);
    const byBrandHoldersList = Array.from(byBrandHolders.entries())
      .map(([label, set]) => [label, set.size] as const)
      .sort((a, b) => b[1] - a[1]);

    return {
      custoAcumulado: totalCost,
      ativos: activeLivesSet.size,
      custoMedioPorVida: activeLivesSet.size > 0 ? totalCost / activeLivesSet.size : 0,
      custoMedioPorMes: monthKeys.length > 0 ? totalCost / monthKeys.length : 0,
      mensalVidasAtivas: monthlyLife,
      mensalTitularesAtivos: monthlyHolder,
      custoMensal: monthlyCost,
      custoPorMarca: byBrandCostList,
      vidasPorMarca: byBrandLivesList,
      titularesPorMarca: byBrandHoldersList,
    };
  }, [filtered]);

  const insightsContext = useMemo(
    () => ({
      filters: {
        year,
        month,
        brand,
        operator,
        plan,
        roles: selectedRoles,
        roleGroups: selectedRoleGroups,
        query: debouncedPerson || null,
      },
      totalCost: metrics.custoAcumulado,
      avgMonthlyCost: metrics.custoMedioPorMes,
      avgCostPerPerson: metrics.custoMedioPorVida,
      activeLives: metrics.ativos,
      topBrands: metrics.custoPorMarca.slice(0, 5),
      monthlyCost: metrics.custoMensal.slice(-6),
      rows: filtered.length,
    }),
    [year, month, brand, operator, plan, selectedRoles, selectedRoleGroups, debouncedPerson, metrics, filtered.length],
  );

  const maxFromList = (
    items: ReadonlyArray<{ value: number }> | ReadonlyArray<readonly [string, number]>,
  ) => {
    const values = items.length
      ? (typeof items[0] === "object" && "value" in items[0]
          ? (items as ReadonlyArray<{ value: number }>).map((i) => i.value)
          : (items as ReadonlyArray<readonly [string, number]>).map((i) => i[1]))
      : [1];
    return Math.max(...values, 1);
  };

  const detailRows = filtered
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 500);
  const detailTotalPages = Math.max(1, Math.ceil(detailRows.length / detailPageSize));
  const detailPageSafe = Math.min(detailPage, detailTotalPages);
  const pagedDetailRows = detailRows.slice(
    (detailPageSafe - 1) * detailPageSize,
    detailPageSafe * detailPageSize,
  );

  return (
    <section className={`indicator-page ${modeClass(mode)} space-y-4`}>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-8">
        <Select
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            setDetailPage(1);
          }}
        >
          <option value="all">Ano</option>
          {options.years.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Select
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            setDetailPage(1);
          }}
        >
          <option value="all">Mes</option>
          {options.months.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Select
          value={brand}
          onChange={(e) => {
            setBrand(e.target.value);
            setDetailPage(1);
          }}
        >
          <option value="all">Marca</option>
          {options.brands.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Select
          value={operator}
          onChange={(e) => {
            setOperator(e.target.value);
            setDetailPage(1);
          }}
        >
          <option value="all">Operadora</option>
          {options.operators.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Select
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value);
            setDetailPage(1);
          }}
        >
          <option value="all">Plano</option>
          {options.plans.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <MultiFilter
          label="Grupo"
          options={options.roleGroups}
          selected={selectedRoleGroups}
          onChange={(next) => { setSelectedRoleGroups(next); setDetailPage(1); }}
        />
        <MultiFilter
          label="Cargo"
          options={options.roles}
          selected={selectedRoles}
          onChange={(next) => { setSelectedRoles(next); setDetailPage(1); }}
        />
        <Input
          value={person}
          onChange={(e) => {
            setPerson(e.target.value);
            setDetailPage(1);
          }}
          placeholder="Titular/Segurado"
        />
      </div>

      {/* KPIs principais */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Custo acumulado" value={formatCurrency(metrics.custoAcumulado)} icon={HandCoins} tone="cost" primary />
        <MetricCard label="Vidas ativas" value={String(metrics.ativos)} icon={ShieldCheck} tone="people" primary />
        <MetricCard label="Custo médio por vida" value={formatCurrency(metrics.custoMedioPorVida)} icon={Users} tone="people" primary />
        <MetricCard label="Custo médio por mês" value={formatCurrency(metrics.custoMedioPorMes)} icon={CalendarDays} tone="cost" primary />
      </div>

      {/* Tendência temporal */}
      <div className="grid gap-4 xl:grid-cols-2">
        <TrendChart title="Vidas ativas por mês" data={metrics.mensalVidasAtivas} type="line" formatValue={String} />
        <TrendChart title="Titulares ativos por mês" data={metrics.mensalTitularesAtivos} type="line" formatValue={String} />
        <div className="xl:col-span-2">
          <TrendChart title="Custo mensal" data={metrics.custoMensal} type="area" formatValue={formatCurrencyCompact} height={180} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RankList title="Custo acumulado por marca" items={metrics.custoPorMarca} max={maxFromList(metrics.custoPorMarca)} />
        <RankList title="Nº de vidas ativas por marca" items={metrics.vidasPorMarca} max={maxFromList(metrics.vidasPorMarca)} numeric />
        <div className="xl:col-span-2">
          <RankList title="Nº de titulares ativos por marca" items={metrics.titularesPorMarca} max={maxFromList(metrics.titularesPorMarca)} numeric />
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold">Detalhamento</h3>
          <span className="text-xs text-muted-foreground">
            Pagina {detailPageSafe}/{detailTotalPages}
          </span>
        </div>
        <div className="mt-3 rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead>Nome do titular</TableHead>
                <TableHead>Nome do segurado</TableHead>
                <TableHead className="text-right">Valor (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados.</TableCell>
                </TableRow>
              ) : (
                pagedDetailRows.map((row, idx) => (
                  <TableRow key={`${row.employeeId}-${row.competence}-${idx}`}>
                    <TableCell>{row.brand}</TableCell>
                    <TableCell>{row.holderName}</TableCell>
                    <TableCell>{row.employeeName}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(row.amount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {detailRows.length > 0 ? (
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setDetailPage((prev) => Math.max(prev - 1, 1))}
              disabled={detailPageSafe <= 1}
            >
              Anterior
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setDetailPage((prev) => Math.min(prev + 1, detailTotalPages))}
              disabled={detailPageSafe >= detailTotalPages}
            >
              Proxima
            </button>
          </div>
        ) : null}
      </section>

      <AiInsightsBox benefit="dental" context={insightsContext} />
    </section>
  );
}

type MetricTone = "cost" | "people" | "economy" | "percent" | "neutral";

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  primary = false,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: MetricTone;
  primary?: boolean;
}) {
  return (
    <div className={`indicator-metric indicator-metric-${tone}`}>
      {Icon ? (
        <div className="indicator-metric-icon">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <p className="indicator-kpi-label mt-1">{label}</p>
      <p className={`mt-1 font-semibold text-foreground ${primary ? "text-2xl" : "text-lg"}`}>{value}</p>
    </div>
  );
}

function BarList({
  title,
  items,
  max,
  numeric,
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
  max: number;
  numeric?: boolean;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      <div className="max-h-80 space-y-3 overflow-auto pr-1">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>
        ) : (
          items.map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate pr-2 text-foreground/80">{item.label}</span>
                <span className="shrink-0 font-medium text-foreground">
                  {numeric ? item.value : formatCurrencyCompact(item.value)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function RankList({
  title,
  items,
  max,
  numeric,
}: {
  title: string;
  items: ReadonlyArray<readonly [string, number]>;
  max: number;
  numeric?: boolean;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      <div className="max-h-80 space-y-3 overflow-auto pr-1">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>
        ) : (
          items.map(([label, value], index) => (
            <div key={label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-4 shrink-0 text-right text-[11px] font-semibold text-muted-foreground">{index + 1}</span>
                  <span className="truncate text-foreground/80">{label}</span>
                </div>
                <span className="shrink-0 pl-2 font-medium text-foreground">
                  {numeric ? value : formatCurrencyCompact(value)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div className="h-1.5 rounded-full bg-[#F9A825] transition-all" style={{ width: `${Math.max((value / max) * 100, 2)}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

