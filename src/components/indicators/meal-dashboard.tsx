"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, HandCoins, Users } from "lucide-react";
import { AiInsightsBox } from "@/components/indicators/ai-insights-box";
import { MultiFilter, matchesMulti } from "@/components/indicators/multi-filter";
import { TrendChart } from "@/components/indicators/trend-chart";
import { Select } from "@/components/ui/select";
import { classifyRole, ROLE_GROUPS } from "@/lib/role-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MealRecord } from "@/server/indicators/dashboard";

type MealDashboardProps = {
  records: MealRecord[];
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
const monthLabel = (month: number) => String(month).padStart(2, "0");
const monthKey = (year: number, month: number) => `${year}-${monthLabel(month)}`;
const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);
const normalizeName = (value: string) => value.trim().toLowerCase();
const modeClass = (mode: "A" | "B" | "C") =>
  mode === "A" ? "indicator-layout-a" : mode === "C" ? "indicator-layout-c" : "indicator-layout-b";

export function MealDashboard({ records, mode = "B" }: MealDashboardProps) {
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [brand, setBrand] = useState("all");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedRoleGroups, setSelectedRoleGroups] = useState<string[]>([]);
  const [personType, setPersonType] = useState("all");
  const [detailGroupBy, setDetailGroupBy] = useState<"employee" | "brand" | "benefit">("employee");
  const [detailPage, setDetailPage] = useState(1);
  const detailPageSize = 18;

  const options = useMemo(() => {
    const unique = (values: string[]) =>
      Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));

    return {
      years: unique(records.map((row) => String(row.year))).sort((a, b) => Number(b) - Number(a)),
      months: unique(records.map((row) => monthKey(row.year, row.month))).sort((a, b) =>
        a.localeCompare(b),
      ),
      brands: unique(records.map((row) => row.brand || "Nao informado")),
      roles: unique(records.map((row) => row.role || "Nao informado")),
      roleGroups: [...ROLE_GROUPS],
      personTypes: unique(records.map((row) => row.personType || "Nao informado")),
    };
  }, [records]);

  const filtered = useMemo(
    () =>
      records.filter((row) => {
        if (year !== "all" && String(row.year) !== year) return false;
        if (month !== "all" && monthKey(row.year, row.month) !== month) return false;
        if (brand !== "all" && (row.brand || "Nao informado") !== brand) return false;
        if (!matchesMulti(selectedRoles, row.role || "Nao informado")) return false;
        if (selectedRoleGroups.length > 0 && !selectedRoleGroups.includes(classifyRole(row.role || "Nao informado"))) return false;
        if (personType !== "all" && (row.personType || "Nao informado") !== personType) return false;
        return true;
      }),
    [records, year, month, brand, selectedRoles, selectedRoleGroups, personType],
  );

  const stats = useMemo(() => {
    const total = sum(filtered.map((row) => row.amount));
    const activeCollabs = new Set(
      filtered.map((row) => normalizeName(row.employeeName || "")).filter((value) => value.length > 0),
    );
    const activeCount = activeCollabs.size;

    const byMonthCost = new Map<string, number>();
    const byMonthHC = new Map<string, Set<string>>();
    const byBrand = new Map<string, number>();
    const byBenefit = new Map<string, number>();

    for (const row of filtered) {
      const mk = monthKey(row.year, row.month);
      byMonthCost.set(mk, (byMonthCost.get(mk) ?? 0) + row.amount);
      if (!byMonthHC.has(mk)) byMonthHC.set(mk, new Set<string>());
      const nameKey = normalizeName(row.employeeName || "");
      if (nameKey.length > 0) byMonthHC.get(mk)?.add(nameKey);

      const brandKey = row.brand || "Nao informado";
      const benefitKey = row.benefit || "Nao informado";
      byBrand.set(brandKey, (byBrand.get(brandKey) ?? 0) + row.amount);
      byBenefit.set(benefitKey, (byBenefit.get(benefitKey) ?? 0) + row.amount);
    }

    const months = Array.from(byMonthCost.keys()).sort((a, b) => a.localeCompare(b));
    const custoMensal = months.map((label) => ({ label, value: byMonthCost.get(label) ?? 0 }));
    const hcMensal = months.map((label) => ({ label, value: byMonthHC.get(label)?.size ?? 0 }));
    const custoPorMarca = Array.from(byBrand.entries()).sort((a, b) => b[1] - a[1]);
    const custoPorBeneficio = Array.from(byBenefit.entries()).sort((a, b) => b[1] - a[1]);

    return {
      custoTotal: total,
      mediaMensal: months.length > 0 ? total / months.length : 0,
      mediaPorColaborador: activeCount > 0 ? total / activeCount : 0,
      colaboradoresAtivos: activeCount,
      custoMensal,
      hcMensal,
      custoPorMarca,
      custoPorBeneficio,
    };
  }, [filtered]);

  const insightsContext = useMemo(
    () => ({
      filters: { year, month, brand, roles: selectedRoles, roleGroups: selectedRoleGroups, personType },
      totalCost: stats.custoTotal,
      avgMonthlyCost: stats.mediaMensal,
      avgCostPerPerson: stats.mediaPorColaborador,
      activeCollaborators: stats.colaboradoresAtivos,
      topBrand: stats.custoPorMarca[0]?.[0] ?? null,
      topBrands: stats.custoPorMarca.slice(0, 5),
      topBenefits: stats.custoPorBeneficio.slice(0, 5),
      monthlyCost: stats.custoMensal.slice(-6),
      rows: filtered.length,
    }),
    [year, month, brand, selectedRoles, selectedRoleGroups, personType, stats, filtered.length],
  );

  const rollupGroups = useMemo(() => {
    const groups = new Map<
      string,
      { label: string; total: number; rows: MealRecord[]; collaborators: Set<string> }
    >();

    for (const row of filtered) {
      const key =
        detailGroupBy === "brand"
          ? row.brand || "Nao informado"
          : detailGroupBy === "benefit"
            ? row.benefit || "Nao informado"
            : row.employeeName || row.employeeId || "Nao informado";

      if (!groups.has(key)) {
        groups.set(key, {
          label: key,
          total: 0,
          rows: [],
          collaborators: new Set<string>(),
        });
      }

      const group = groups.get(key);
      if (!group) continue;
      group.total += row.amount;
      group.rows.push(row);
      if (row.employeeName) group.collaborators.add(normalizeName(row.employeeName));
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        rows: group.rows.sort((a, b) => b.amount - a.amount),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 120);
  }, [filtered, detailGroupBy]);

  const detailTotalPages = Math.max(1, Math.ceil(rollupGroups.length / detailPageSize));
  const detailPageSafe = Math.min(detailPage, detailTotalPages);
  const pagedGroups = rollupGroups.slice(
    (detailPageSafe - 1) * detailPageSize,
    detailPageSafe * detailPageSize,
  );

  return (
    <section className={`indicator-page ${modeClass(mode)} space-y-4`}>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
        <Select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="all">Ano</option>
          {options.years.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        <Select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="all">Mes</option>
          {options.months.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        <Select value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="all">Marca</option>
          {options.brands.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        <MultiFilter label="Grupo" options={options.roleGroups} selected={selectedRoleGroups} onChange={setSelectedRoleGroups} />
        <MultiFilter label="Cargo" options={options.roles} selected={selectedRoles} onChange={setSelectedRoles} />
        <Select value={personType} onChange={(e) => setPersonType(e.target.value)}>
          <option value="all">Tipo Pessoa</option>
          {options.personTypes.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </div>

      {/* KPIs principais */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Custo total" value={formatCurrency(stats.custoTotal)} icon={HandCoins} tone="cost" primary />
        <MetricCard label="Média mensal" value={formatCurrency(stats.mediaMensal)} icon={CalendarDays} tone="cost" primary />
        <MetricCard label="Média por colaborador" value={formatCurrency(stats.mediaPorColaborador)} icon={Users} tone="people" primary />
        <MetricCard label="Colaboradores ativos" value={String(stats.colaboradoresAtivos)} icon={Users} tone="people" primary />
      </div>

      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b border-border pb-0.5">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="colabs">Colabs</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <RankList title="Custo por marca (acumulado)" items={stats.custoPorMarca} />
            <RankList title="Custo por benefício (acumulado)" items={stats.custoPorBeneficio} />
            <div className="xl:col-span-2">
              <TrendChart title="Custo mensal" data={stats.custoMensal} type="area" formatValue={formatCurrencyCompact} height={180} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="colabs" className="space-y-4">
          <div className="grid gap-4 grid-cols-1">
            <TrendChart title="Headcount mensal" data={stats.hcMensal} type="line" formatValue={String} />
          </div>
        </TabsContent>
      </Tabs>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold">Detalhamento (roll-down)</h3>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            <span className="text-xs text-muted-foreground">
              Pagina {detailPageSafe}/{detailTotalPages}
            </span>
            <div className="w-full sm:w-60">
              <Select
                value={detailGroupBy}
                onChange={(event) => {
                  setDetailGroupBy(event.target.value as "employee" | "brand" | "benefit");
                  setDetailPage(1);
                }}
              >
                <option value="employee">Agrupar por colaborador</option>
                <option value="brand">Agrupar por marca</option>
                <option value="benefit">Agrupar por beneficio</option>
              </Select>
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {rollupGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados.</p>
          ) : (
            <>
              <div className="grid grid-cols-12 items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                <div className="col-span-8">
                  {detailGroupBy === "employee"
                    ? "Colaborador"
                    : detailGroupBy === "brand"
                      ? "Marca"
                      : "Beneficio"}
                </div>
                <div className="col-span-2 text-right">Registros</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {pagedGroups.map((group) => (
                <details
                  key={group.label}
                  className="group overflow-hidden rounded-lg border bg-background transition hover:border-slate-300"
                >
                  <summary className="cursor-pointer list-none px-4 py-3">
                    <div className="grid grid-cols-12 items-center gap-2 text-sm">
                      <div className="col-span-8 flex items-center gap-2 font-medium">
                        <span className="text-slate-400 transition group-open:rotate-90">{">"}</span>
                        <span className="truncate">{group.label}</span>
                      </div>
                      <div className="col-span-2 text-right text-slate-500">{group.rows.length}</div>
                      <div className="col-span-2 text-right font-semibold">{formatCurrency(group.total)}</div>
                    </div>
                  </summary>
                  <div className="border-t px-4 py-3">
                    <div className="max-h-80 overflow-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Beneficio</TableHead>
                            <TableHead>Colaborador</TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Mes</TableHead>
                            <TableHead className="text-right">Valor (R$)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.rows.slice(0, 100).map((row, idx) => (
                            <TableRow key={`${group.label}-${row.employeeId}-${row.competence}-${idx}`}>
                              <TableCell>{row.benefit}</TableCell>
                              <TableCell>{row.employeeName}</TableCell>
                              <TableCell>{row.brand}</TableCell>
                              <TableCell>{row.role}</TableCell>
                              <TableCell>{monthKey(row.year, row.month)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(row.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </details>
              ))}
            </>
          )}
        </div>
        {rollupGroups.length > 0 ? (
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

      <AiInsightsBox benefit="meal" context={insightsContext} />
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
  numeric,
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
  numeric?: boolean;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

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
                <div
                  className="h-1.5 rounded-full bg-primary transition-all"
                  style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }}
                />
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
}: {
  title: string;
  items: ReadonlyArray<readonly [string, number]>;
}) {
  const max = Math.max(...items.map((item) => item[1]), 1);

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
                <span className="shrink-0 pl-2 font-medium text-foreground">{formatCurrencyCompact(value)}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-[#F9A825] transition-all"
                  style={{ width: `${Math.max((value / max) * 100, 2)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
