"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Activity, BadgePercent, HandCoins, HeartPulse, Users } from "lucide-react";
import { AiInsightsBox } from "@/components/indicators/ai-insights-box";
import { MultiFilter, matchesMulti } from "@/components/indicators/multi-filter";
import { TrendChart } from "@/components/indicators/trend-chart";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { classifyRole, ROLE_GROUPS } from "@/lib/role-group";
import type { HealthCopartRecord, HealthRecord } from "@/server/indicators/dashboard";

type HealthDashboardProps = {
  records: HealthRecord[];
  copartRecords: HealthCopartRecord[];
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
const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);
const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;
const personKey = (employeeId: string, employeeName: string) => {
  const id = employeeId.replace(/\D/g, "").trim();
  if (id) return `id:${id}`;
  const name = employeeName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return name ? `name:${name}` : "";
};

const modeClass = (mode: "A" | "B" | "C") =>
  mode === "A" ? "indicator-layout-a" : mode === "C" ? "indicator-layout-c" : "indicator-layout-b";

export function HealthDashboard({ records, copartRecords, mode = "B" }: HealthDashboardProps) {
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [brand, setBrand] = useState("all");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedRoleGroups, setSelectedRoleGroups] = useState<string[]>([]);
  const [status, setStatus] = useState("all");
  const [holderType, setHolderType] = useState("all");
  const [person, setPerson] = useState("");
  const debouncedPerson = useDebouncedValue(person, 300);

  const options = useMemo(() => {
    const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean))).sort((a, b) => a.localeCompare(b));

    return {
      years: uniq(records.map((r) => String(r.year))).sort((a, b) => Number(b) - Number(a)),
      months: Array.from({ length: 12 }, (_, index) => String(index + 1)),
      brands: uniq(records.map((r) => r.brand || "Nao informado")),
      roles: uniq(records.map((r) => r.role || "Nao informado")),
      roleGroups: [...ROLE_GROUPS],
      statuses: uniq(records.map((r) => r.status || "Nao informado")),
      holderTypes: uniq(records.map((r) => r.holderType || "Nao informado")),
    };
  }, [records]);

  const filteredMain = useMemo(() => {
    const query = debouncedPerson.trim().toLowerCase();
    return records.filter((row) => {
      if (year !== "all" && String(row.year) !== year) return false;
      if (month !== "all" && String(row.month) !== month) return false;
      if (brand !== "all" && (row.brand || "Nao informado") !== brand) return false;
      if (!matchesMulti(selectedRoles, row.role || "Nao informado")) return false;
      if (selectedRoleGroups.length > 0 && !selectedRoleGroups.includes(classifyRole(row.role || "Nao informado"))) return false;
      if (status !== "all" && (row.status || "Nao informado") !== status) return false;
      if (holderType !== "all" && (row.holderType || "Nao informado") !== holderType) return false;
      if (query) {
        const text = `${row.employeeName} ${row.employeeId}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }, [records, year, month, brand, selectedRoles, selectedRoleGroups, status, holderType, debouncedPerson]);

  const filteredPremiumRows = useMemo(
    () => filteredMain.filter((row) => row.premiumAmount > 0),
    [filteredMain],
  );

  const filteredDiscountRows = useMemo(
    () => filteredMain.filter((row) => row.discountAmount > 0),
    [filteredMain],
  );

  const selectedPeople = useMemo(() => {
    const keys = filteredPremiumRows
      .map((r) => personKey(r.employeeId, r.employeeName))
      .filter((value) => value.length > 0);
    return new Set(keys);
  }, [filteredPremiumRows]);

  const filteredCopart = useMemo(() => {
    const query = debouncedPerson.trim().toLowerCase();
    const restrictByMain = selectedRoles.length > 0 || selectedRoleGroups.length > 0 || status !== "all" || holderType !== "all";

    return copartRecords.filter((row) => {
      if (year !== "all" && String(row.year) !== year) return false;
      if (month !== "all" && String(row.month) !== month) return false;
      if (brand !== "all" && (row.brand || "Nao informado") !== brand) return false;
      if (query) {
        const text = `${row.employeeName} ${row.employeeId}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      if (restrictByMain) {
        const id = personKey(row.employeeId, row.employeeName);
        if (!id || !selectedPeople.has(id)) return false;
      }
      return true;
    });
  }, [copartRecords, year, month, brand, debouncedPerson, selectedRoles, selectedRoleGroups, status, holderType, selectedPeople]);

  const metrics = useMemo(() => {
    const totalPremium = sum(filteredPremiumRows.map((r) => r.premiumAmount));
    const totalDiscount = sum(filteredDiscountRows.map((r) => r.discountAmount));
    const netCost = totalPremium - totalDiscount;

    const byMonthLives = new Map<string, Set<string>>();
    const byMonthPremium = new Map<string, number>();
    const byBrandPremium = new Map<string, number>();
    const byBrandDiscount = new Map<string, number>();

    for (const row of filteredPremiumRows) {
      const mk = monthKey(row.year, row.month);
      if (!byMonthLives.has(mk)) byMonthLives.set(mk, new Set<string>());
      byMonthPremium.set(mk, (byMonthPremium.get(mk) ?? 0) + row.premiumAmount);

      const person = personKey(row.employeeId, row.employeeName);
      if (person) byMonthLives.get(mk)?.add(person);

      const b = row.brand || "Nao informado";
      byBrandPremium.set(b, (byBrandPremium.get(b) ?? 0) + row.premiumAmount);
    }

    for (const row of filteredDiscountRows) {
      const b = row.brand || "Nao informado";
      byBrandDiscount.set(b, (byBrandDiscount.get(b) ?? 0) + row.discountAmount);
    }

    const totalCopart = sum(filteredCopart.map((r) => r.copartAmount));
    const totalCopartDiscount = sum(filteredCopart.map((r) => r.copartDiscountAmount));

    const byMonthCopart = new Map<string, number>();
    const byMonthCopartLives = new Map<string, Set<string>>();
    const byBrandCopart = new Map<string, number>();

    for (const row of filteredCopart) {
      const mk = monthKey(row.year, row.month);
      byMonthCopart.set(mk, (byMonthCopart.get(mk) ?? 0) + row.copartAmount);

      if (!byMonthCopartLives.has(mk)) byMonthCopartLives.set(mk, new Set<string>());
      const person = personKey(row.employeeId, row.employeeName);
      if (person) byMonthCopartLives.get(mk)?.add(person);

      const b = row.brand || "Nao informado";
      byBrandCopart.set(b, (byBrandCopart.get(b) ?? 0) + row.copartAmount);
    }

    const monthsMain = Array.from(byMonthPremium.keys()).sort((a, b) => a.localeCompare(b));
    const monthsCopart = Array.from(byMonthCopart.keys()).sort((a, b) => a.localeCompare(b));
    const latestMonth = monthsMain.at(-1) ?? null;
    const activeLivesLatestMonth = latestMonth
      ? (byMonthLives.get(latestMonth)?.size ?? 0)
      : 0;
    const uniquePersonMonthCount = Array.from(byMonthLives.values()).reduce(
      (acc, set) => acc + set.size,
      0,
    );

    return {
      custoAcumulado: totalPremium,
      descontoPlanoSaude: totalDiscount,
      custoMedioPorVida:
        uniquePersonMonthCount > 0 ? totalPremium / uniquePersonMonthCount : 0,
      custoMedioPorVidaPosDesconto:
        uniquePersonMonthCount > 0 ? netCost / uniquePersonMonthCount : 0,
      vidasAtivas: activeLivesLatestMonth,
      vidasPorMes: monthsMain.map((m) => ({ label: m, value: byMonthLives.get(m)?.size ?? 0 })),
      mensalidadePorMes: monthsMain.map((m) => ({ label: m, value: byMonthPremium.get(m) ?? 0 })),
      totalCopart,
      custoMensalCopart: monthsCopart.length > 0 ? totalCopart / monthsCopart.length : 0,
      vidasCopartPorMes: monthsCopart.map((m) => ({ label: m, value: byMonthCopartLives.get(m)?.size ?? 0 })),
      valorCopartPorMes: monthsCopart.map((m) => ({ label: m, value: byMonthCopart.get(m) ?? 0 })),
      mensalidadePorMarca: Array.from(byBrandPremium.entries()).sort((a, b) => b[1] - a[1]),
      descontoPorMarca: Array.from(byBrandDiscount.entries()).sort((a, b) => b[1] - a[1]),
      percentualDesconto: pct(totalDiscount, totalPremium),
      copartPorMarca: Array.from(byBrandCopart.entries()).sort((a, b) => b[1] - a[1]),
      descontoCopart: totalCopartDiscount,
      percentualDescontoCopart: pct(totalCopartDiscount, totalCopart),
    };
  }, [filteredPremiumRows, filteredDiscountRows, filteredCopart]);

  const insightsContext = useMemo(
    () => ({
      filters: {
        year,
        month,
        brand,
        roles: selectedRoles,
        roleGroups: selectedRoleGroups,
        status,
        holderType,
        query: debouncedPerson || null,
      },
      totalCost: metrics.custoAcumulado,
      avgCostPerPerson: metrics.custoMedioPorVida,
      netAvgCostPerPerson: metrics.custoMedioPorVidaPosDesconto,
      activeLives: metrics.vidasAtivas,
      totalCopart: metrics.totalCopart,
      copartMonthlyAvg: metrics.custoMensalCopart,
      copartDiscount: metrics.descontoCopart,
      discountPercent: metrics.percentualDesconto,
      topPremiumBrands: metrics.mensalidadePorMarca.slice(0, 5),
      topCopartBrands: metrics.copartPorMarca.slice(0, 5),
      rows: {
        mensalidades: filteredPremiumRows.length,
        copart: filteredCopart.length,
      },
    }),
    [
      year,
      month,
      brand,
      selectedRoles,
      selectedRoleGroups,
      status,
      holderType,
      debouncedPerson,
      metrics,
      filteredPremiumRows.length,
      filteredCopart.length,
    ],
  );

  const maxBar = (list: Array<{ value: number }>) => Math.max(...list.map((i) => i.value), 1);
  const maxRank = (list: ReadonlyArray<readonly [string, number]>) => Math.max(...list.map(([, v]) => v), 1);

  return (
    <section className={`indicator-page ${modeClass(mode)} space-y-4`}>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
        <Select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="all">Ano</option>
          {options.years.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="all">Mes</option>
          {options.months.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Select value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="all">Marca</option>
          {options.brands.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <MultiFilter label="Grupo" options={options.roleGroups} selected={selectedRoleGroups} onChange={setSelectedRoleGroups} />
        <MultiFilter label="Cargo" options={options.roles} selected={selectedRoles} onChange={setSelectedRoles} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Situacao</option>
          {options.statuses.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Select value={holderType} onChange={(e) => setHolderType(e.target.value)}>
          <option value="all">Titular/Dependente</option>
          {options.holderTypes.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Nome/CPF" />
      </div>

      {/* KPIs principais */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Custo acumulado" value={formatCurrencyCompact(metrics.custoAcumulado)} icon={HandCoins} tone="cost" primary />
        <MetricCard label="Vidas ativas" value={String(metrics.vidasAtivas)} icon={HeartPulse} tone="people" primary />
        <MetricCard label="Custo médio por vida" value={formatCurrencyCompact(metrics.custoMedioPorVida)} icon={Users} tone="people" primary />
        <MetricCard label="Total coparticipação" value={formatCurrencyCompact(metrics.totalCopart)} icon={Activity} tone="cost" primary />
      </div>

      {/* KPIs secundários */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Desconto plano de saúde" value={formatCurrencyCompact(metrics.descontoPlanoSaude)} icon={BadgePercent} tone="percent" />
        <MetricCard label="Desconto coparticipação" value={formatCurrencyCompact(metrics.descontoCopart)} icon={BadgePercent} tone="percent" />
        <MetricCard label="Custo médio pós desconto" value={formatCurrencyCompact(metrics.custoMedioPorVidaPosDesconto)} icon={BadgePercent} tone="percent" />
        <MetricCard label="Custo mensal copart" value={formatCurrencyCompact(metrics.custoMensalCopart)} icon={HandCoins} tone="cost" />
      </div>

      {/* Tendência temporal */}
      <div className="grid gap-4 xl:grid-cols-2">
        <TrendChart title="Vidas ativas por mês" data={metrics.vidasPorMes} type="line" formatValue={String} />
        <TrendChart title="Mensalidade mensal" data={metrics.mensalidadePorMes} type="area" formatValue={formatCurrencyCompact} />
        <div className="xl:col-span-2">
          <TrendChart title="Coparticipação mensal" data={metrics.valorCopartPorMes} type="area" formatValue={formatCurrencyCompact} height={180} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <TrendChart title="Vidas com coparticipação por mês" data={metrics.vidasCopartPorMes} type="line" formatValue={String} />
        <RankList title="Mensalidade por marca" items={metrics.mensalidadePorMarca} max={maxRank(metrics.mensalidadePorMarca)} />
        <div className="xl:col-span-2">
          <RankList title="Coparticipação por marca" items={metrics.copartPorMarca} max={maxRank(metrics.copartPorMarca)} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="xl:col-span-2">
          <RankList title="Desconto por marca" items={metrics.descontoPorMarca} max={maxRank(metrics.descontoPorMarca)} />
        </div>
        <div className="xl:col-span-2">
          <MetricCard label="Registros filtrados" value={`${filteredPremiumRows.length} mensalidades | ${filteredCopart.length} copart`} icon={Users} tone="neutral" />
        </div>
      </div>

      <AiInsightsBox benefit="health" context={insightsContext} />
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
                  <span className="shrink-0 text-[11px] font-semibold text-muted-foreground w-4 text-right">
                    {index + 1}
                  </span>
                  <span className="truncate text-foreground/80">{label}</span>
                </div>
                <span className="shrink-0 pl-2 font-medium text-foreground">
                  {numeric ? value : formatCurrencyCompact(value)}
                </span>
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

