"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import type { LucideIcon } from "lucide-react";
import { ArrowUpDown, Bus, CalendarDays, HandCoins, PiggyBank, Users } from "lucide-react";
import { AiInsightsBox } from "@/components/indicators/ai-insights-box";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TransportRecord } from "@/server/indicators/dashboard";

type VtDashboardProps = {
  records: TransportRecord[];
  mode?: "A" | "B" | "C";
};

type GroupDimension = "brand" | "role" | "month" | "collaborator" | "year" | "economy";

type ComparisonRow = {
  label: string;
  monthA: number;
  monthB: number;
  diff: number;
  diffPercent: number | null;
};

type SavedView = {
  name: string;
  selectedYears: string[];
  selectedMonths: string[];
  selectedBrands: string[];
  selectedRoles: string[];
  selectedEconomy: string[];
  collaborator: string;
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
const monthLabel = (month: number) => `${String(month).padStart(2, "0")}`;
const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);
const formatPercent = (value: number | null) =>
  value === null ? "N/A" : `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

const dimensionLabels: Record<GroupDimension, string> = {
  brand: "Marca",
  role: "Cargo",
  month: "Mes",
  collaborator: "Colaborador",
  year: "Ano",
  economy: "Economia",
};

const dimensionValue = (row: TransportRecord, dimension: GroupDimension) => {
  if (dimension === "brand") return row.brand || "Nao informado";
  if (dimension === "role") return row.role || "Nao informado";
  if (dimension === "month") return `${row.year}-${monthLabel(row.month)}`;
  if (dimension === "year") return String(row.year);
  if (dimension === "economy") {
    return row.hasEconomy || row.economyAmount > 0 ? "Com economia" : "Sem economia";
  }
  return row.employeeName || row.employeeId || "Nao informado";
};

const sortByValueDesc = (entries: [string, number][]) =>
  [...entries].sort((a, b) => b[1] - a[1]);

const toggleValue = (items: string[], value: string) =>
  items.includes(value) ? items.filter((item) => item !== value) : [...items, value];

const matchesMulti = (selected: string[], value: string) =>
  selected.length === 0 || selected.includes(value);

const buildComparisonRows = (
  rowsA: TransportRecord[],
  rowsB: TransportRecord[],
  groupBy: (row: TransportRecord) => string,
): ComparisonRow[] => {
  const mapA = new Map<string, number>();
  const mapB = new Map<string, number>();

  for (const row of rowsA) {
    const key = groupBy(row) || "Nao informado";
    mapA.set(key, (mapA.get(key) ?? 0) + row.amount);
  }
  for (const row of rowsB) {
    const key = groupBy(row) || "Nao informado";
    mapB.set(key, (mapB.get(key) ?? 0) + row.amount);
  }

  const labels = Array.from(new Set([...mapA.keys(), ...mapB.keys()])).sort((a, b) =>
    a.localeCompare(b),
  );

  return labels
    .map((label) => {
      const monthA = mapA.get(label) ?? 0;
      const monthB = mapB.get(label) ?? 0;
      const diff = monthB - monthA;
      const diffPercent = monthA > 0 ? (diff / monthA) * 100 : null;
      return { label, monthA, monthB, diff, diffPercent };
    })
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
};

function MultiFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="justify-between">
          <span>{label}</span>
          <span className="text-xs text-muted-foreground">
            {selected.length === 0 ? "Todos" : `${selected.length} selecionado(s)`}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={selected.length === 0}
          onCheckedChange={(checked) => {
            if (checked) onChange([]);
          }}
        >
          Todos
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={selected.includes(option)}
            onCheckedChange={() => onChange(toggleValue(selected, option))}
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const modeClass = (mode: "A" | "B" | "C") =>
  mode === "A" ? "indicator-layout-a" : mode === "C" ? "indicator-layout-c" : "indicator-layout-b";

export function VtDashboard({ records, mode = "B" }: VtDashboardProps) {
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedEconomy, setSelectedEconomy] = useState<string[]>([]);
  const [collaborator, setCollaborator] = useState("");
  const debouncedCollaborator = useDebouncedValue(collaborator, 300);
  const [crossX, setCrossX] = useState<GroupDimension>("brand");
  const [crossY, setCrossY] = useState<GroupDimension>("role");
  const [crossPage, setCrossPage] = useState(1);
  const crossPageSize = 15;
  const [tableGroupBy, setTableGroupBy] = useState<GroupDimension>("brand");
  const [analyticPage, setAnalyticPage] = useState(1);
  const analyticPageSize = 25;
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("vt_saved_views");
      return raw ? (JSON.parse(raw) as SavedView[]) : [];
    } catch {
      return [];
    }
  });
  const [newViewName, setNewViewName] = useState("");

  useEffect(() => {
    localStorage.setItem("vt_saved_views", JSON.stringify(savedViews));
  }, [savedViews]);


  const options = useMemo(() => {
    const years = Array.from(new Set(records.map((row) => String(row.year)))).sort(
      (a, b) => Number(b) - Number(a),
    );

    const months = Array.from(
      new Set(records.map((row) => `${row.year}-${monthLabel(row.month)}`)),
    ).sort((a, b) => a.localeCompare(b));

    const brands = Array.from(new Set(records.map((row) => row.brand || "Nao informado"))).sort(
      (a, b) => a.localeCompare(b),
    );

    const roles = Array.from(new Set(records.map((row) => row.role || "Nao informado"))).sort(
      (a, b) => a.localeCompare(b),
    );

    return {
      years,
      months,
      brands,
      roles,
      economy: ["Com economia", "Sem economia"],
    };
  }, [records]);

  const filtered = useMemo(() => {
    const query = debouncedCollaborator.trim().toLowerCase();

    return records.filter((row) => {
      const yearValue = String(row.year);
      const monthValue = `${row.year}-${monthLabel(row.month)}`;
      const brandValue = row.brand || "Nao informado";
      const roleValue = row.role || "Nao informado";
      const economyValue =
        row.hasEconomy || row.economyAmount > 0 ? "Com economia" : "Sem economia";

      if (!matchesMulti(selectedYears, yearValue)) return false;
      if (!matchesMulti(selectedMonths, monthValue)) return false;
      if (!matchesMulti(selectedBrands, brandValue)) return false;
      if (!matchesMulti(selectedRoles, roleValue)) return false;
      if (!matchesMulti(selectedEconomy, economyValue)) return false;

      if (query) {
        const employee = `${row.employeeName} ${row.employeeId}`.toLowerCase();
        if (!employee.includes(query)) return false;
      }

      return true;
    });
  }, [
    records,
    debouncedCollaborator,
    selectedYears,
    selectedMonths,
    selectedBrands,
    selectedRoles,
    selectedEconomy,
  ]);

  const stats = useMemo(() => {
    const total = sum(filtered.map((row) => row.amount));
    const economyTotal = sum(filtered.map((row) => row.economyAmount));

    const competenceKeys = new Set(filtered.map((row) => row.competence));
    const monthsCount = competenceKeys.size;

    const mediaMensal = monthsCount > 0 ? total / monthsCount : 0;

    const byBrandCost = new Map<string, number>();
    const byBrandEconomy = new Map<string, number>();
    const byRole = new Map<string, number>();
    const byMonthCost = new Map<string, number>();
    const byMonthEconomy = new Map<string, number>();
    const byMonthPeople = new Map<string, Set<string>>();
    const byColabMonth = new Map<string, number>();

    for (const row of filtered) {
      const brandName = row.brand || "Nao informado";
      const roleName = row.role || "Nao informado";
      const monthKey = `${row.year}-${monthLabel(row.month)}`;
      const colabKey = `${row.employeeId || row.employeeName || "sem-id"}::${row.competence}`;

      byBrandCost.set(brandName, (byBrandCost.get(brandName) ?? 0) + row.amount);
      byBrandEconomy.set(brandName, (byBrandEconomy.get(brandName) ?? 0) + row.economyAmount);
      byRole.set(roleName, (byRole.get(roleName) ?? 0) + row.amount);
      byMonthCost.set(monthKey, (byMonthCost.get(monthKey) ?? 0) + row.amount);
      byMonthEconomy.set(monthKey, (byMonthEconomy.get(monthKey) ?? 0) + row.economyAmount);
      if (!byMonthPeople.has(monthKey)) byMonthPeople.set(monthKey, new Set<string>());
      const personKey = row.employeeId || row.employeeName;
      if (personKey) byMonthPeople.get(monthKey)?.add(personKey);
      byColabMonth.set(colabKey, (byColabMonth.get(colabKey) ?? 0) + row.amount);
    }

    const custoPorMarca = sortByValueDesc(Array.from(byBrandCost.entries()));
    const economiaPorMarca = sortByValueDesc(Array.from(byBrandEconomy.entries()));
    const subtotalCargo = sortByValueDesc(Array.from(byRole.entries()));

    const custoMensalOrdenado = Array.from(byMonthCost.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    const economiaMensalOrdenado = Array.from(byMonthEconomy.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    const latestMonth = custoMensalOrdenado.at(-1)?.[0] ?? null;
    const optantes = latestMonth ? (byMonthPeople.get(latestMonth)?.size ?? 0) : 0;
    const mediaPorColab = optantes > 0 ? total / optantes : 0;

    const valorPorColabMes =
      byColabMonth.size > 0 ? sum(Array.from(byColabMonth.values())) / byColabMonth.size : 0;

    const trendWithMovingAvg = custoMensalOrdenado.map(([month, value], index, arr) => {
      const window = arr.slice(Math.max(0, index - 2), index + 1);
      const movingAvg = sum(window.map((item) => item[1])) / window.length;
      return { month, value, movingAvg };
    });

    return {
      total,
      mediaMensal,
      mediaPorColab,
      optantes,
      custoPorMarca,
      custoMensalOrdenado,
      subtotalCargo,
      economyTotal,
      economiaPorMarca,
      economiaMensalOrdenado,
      valorPorColabMes,
      trendWithMovingAvg,
    };
  }, [filtered]);

  const monthComparison = useMemo(() => {
    if (selectedMonths.length !== 2) return null;

    const [monthA, monthB] = [...selectedMonths].sort((a, b) => a.localeCompare(b));
    const rowsA = filtered.filter((row) => `${row.year}-${monthLabel(row.month)}` === monthA);
    const rowsB = filtered.filter((row) => `${row.year}-${monthLabel(row.month)}` === monthB);

    const totalA = sum(rowsA.map((row) => row.amount));
    const totalB = sum(rowsB.map((row) => row.amount));
    const economyA = sum(rowsA.map((row) => row.economyAmount));
    const economyB = sum(rowsB.map((row) => row.economyAmount));
    const diffTotal = totalB - totalA;
    const diffPercent = totalA > 0 ? (diffTotal / totalA) * 100 : null;

    return {
      monthA,
      monthB,
      totalA,
      totalB,
      economyA,
      economyB,
      diffTotal,
      diffPercent,
      byBrand: buildComparisonRows(rowsA, rowsB, (row) => row.brand || "Nao informado"),
      byRole: buildComparisonRows(rowsA, rowsB, (row) => row.role || "Nao informado"),
    };
  }, [filtered, selectedMonths]);

  const crossing = useMemo(() => {
    const rowLabels = Array.from(new Set(filtered.map((row) => dimensionValue(row, crossX)))).sort(
      (a, b) => a.localeCompare(b),
    );
    const colLabels = Array.from(new Set(filtered.map((row) => dimensionValue(row, crossY)))).sort(
      (a, b) => a.localeCompare(b),
    );

    const cellMap = new Map<string, { total: number; people: Set<string>; months: Set<string> }>();

    for (const row of filtered) {
      const rowKey = dimensionValue(row, crossX);
      const colKey = dimensionValue(row, crossY);
      const key = `${rowKey}|||${colKey}`;

      const current = cellMap.get(key) ?? {
        total: 0,
        people: new Set<string>(),
        months: new Set<string>(),
      };
      const personKey = row.employeeId || row.employeeName;
      const monthKey = `${row.year}-${monthLabel(row.month)}`;

      cellMap.set(key, {
        total: current.total + row.amount,
        people: personKey ? new Set([...current.people, personKey]) : current.people,
        months: new Set([...current.months, monthKey]),
      });
    }

    return { rowLabels, colLabels, cellMap };
  }, [filtered, crossX, crossY]);

  const crossTotalPages = Math.max(1, Math.ceil(crossing.rowLabels.length / crossPageSize));
  const crossPageSafe = Math.min(crossPage, crossTotalPages);
  const crossingRows = crossing.rowLabels.slice(
    (crossPageSafe - 1) * crossPageSize,
    crossPageSafe * crossPageSize,
  );

  const analyticTable = useMemo(() => {
    const grouped = new Map<
      string,
      { total: number; people: Set<string>; months: Set<string>; records: number }
    >();

    for (const row of filtered) {
      const key = dimensionValue(row, tableGroupBy);
      const current = grouped.get(key) ?? {
        total: 0,
        people: new Set<string>(),
        months: new Set<string>(),
        records: 0,
      };

      const personKey = row.employeeId || row.employeeName;
      const monthKey = `${row.year}-${monthLabel(row.month)}`;

      grouped.set(key, {
        total: current.total + row.amount,
        people: personKey ? new Set([...current.people, personKey]) : current.people,
        months: new Set([...current.months, monthKey]),
        records: current.records + 1,
      });
    }

    return Array.from(grouped.entries())
      .map(([group, values]) => {
        const peopleCount = values.people.size;
        return {
          group,
          total: values.total,
          peopleCount,
          monthsCount: values.months.size,
          records: values.records,
          avgPerPerson:
            peopleCount > 0 && values.months.size > 0
              ? values.total / (peopleCount * values.months.size)
              : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filtered, tableGroupBy]);

  const analyticTotalPages = Math.max(1, Math.ceil(analyticTable.length / analyticPageSize));
  const analyticPageSafe = Math.min(analyticPage, analyticTotalPages);
  const analyticRows = analyticTable.slice(
    (analyticPageSafe - 1) * analyticPageSize,
    analyticPageSafe * analyticPageSize,
  );

  const outliers = useMemo(() => {
    const byPerson = new Map<string, { total: number; months: Set<string>; name: string }>();
    for (const row of filtered) {
      const id = row.employeeId || row.employeeName;
      if (!id) continue;
      const current = byPerson.get(id) ?? {
        total: 0,
        months: new Set<string>(),
        name: row.employeeName || row.employeeId || "Nao informado",
      };
      byPerson.set(id, {
        total: current.total + row.amount,
        months: new Set([...current.months, row.competence]),
        name: current.name,
      });
    }

    const values = Array.from(byPerson.values()).map((item) => ({
      name: item.name,
      avg: item.months.size > 0 ? item.total / item.months.size : item.total,
    }));

    const sorted = [...values].sort((a, b) => a.avg - b.avg);
    if (sorted.length === 0) return { top: [], median: 0, q1: 0, q3: 0 };

    const at = (p: number) => sorted[Math.floor((sorted.length - 1) * p)]?.avg ?? 0;
    const q1 = at(0.25);
    const median = at(0.5);
    const q3 = at(0.75);
    const iqr = q3 - q1;
    const threshold = q3 + 1.5 * iqr;

    return {
      top: sorted.filter((item) => item.avg > threshold).sort((a, b) => b.avg - a.avg).slice(0, 10),
      median,
      q1,
      q3,
    };
  }, [filtered]);

  const distribution = useMemo(() => {
    const buckets = [
      { label: "0-200", min: 0, max: 200 },
      { label: "201-400", min: 201, max: 400 },
      { label: "401-700", min: 401, max: 700 },
      { label: "701-1000", min: 701, max: 1000 },
      { label: "1000+", min: 1001, max: Number.POSITIVE_INFINITY },
    ];

    const counts = new Map<string, number>(buckets.map((b) => [b.label, 0]));

    for (const row of analyticTable) {
      const value = row.avgPerPerson;
      const bucket = buckets.find((b) => value >= b.min && value <= b.max);
      if (bucket) counts.set(bucket.label, (counts.get(bucket.label) ?? 0) + 1);
    }

    return buckets.map((b) => ({ label: b.label, count: counts.get(b.label) ?? 0 }));
  }, [analyticTable]);

  const dataQuality = useMemo(() => {
    let missingEmployee = 0;
    let nonPositiveAmount = 0;
    let invalidMonth = 0;
    let economyMismatch = 0;

    for (const row of records) {
      if (!row.employeeId && !row.employeeName) missingEmployee += 1;
      if (row.amount <= 0) nonPositiveAmount += 1;
      if (row.month < 1 || row.month > 12) invalidMonth += 1;
      if (row.economyAmount > 0 && !row.hasEconomy) economyMismatch += 1;
    }

    return {
      missingEmployee,
      nonPositiveAmount,
      invalidMonth,
      economyMismatch,
    };
  }, [records]);


  const insightsContext = useMemo(
    () => ({
      filters: {
        years: selectedYears,
        months: selectedMonths,
        brands: selectedBrands,
        roles: selectedRoles,
        economy: selectedEconomy,
        collaborator: debouncedCollaborator || null,
      },
      total: stats.total,
      mediaMensal: stats.mediaMensal,
      mediaPorColab: stats.mediaPorColab,
      optantes: stats.optantes,
      economiaAcumulada: stats.economyTotal,
      valorPorColabMes: stats.valorPorColabMes,
      topBrands: stats.custoPorMarca.slice(0, 5),
      topEconomyBrands: stats.economiaPorMarca.slice(0, 5),
      monthlyCost: stats.custoMensalOrdenado.slice(-6),
      monthlyEconomy: stats.economiaMensalOrdenado.slice(-6),
      outliers: outliers.top.slice(0, 5),
      comparativo: monthComparison
        ? {
            monthA: monthComparison.monthA,
            monthB: monthComparison.monthB,
            diffTotal: monthComparison.diffTotal,
            diffPercent: monthComparison.diffPercent,
          }
        : null,
      rows: filtered.length,
    }),
    [
      selectedYears,
      selectedMonths,
      selectedBrands,
      selectedRoles,
      selectedEconomy,
      debouncedCollaborator,
      stats,
      outliers.top,
      monthComparison,
      filtered.length,
    ],
  );

  const saveCurrentView = () => {
    const name = newViewName.trim();
    if (!name) return;
    const view: SavedView = {
      name,
      selectedYears,
      selectedMonths,
      selectedBrands,
      selectedRoles,
      selectedEconomy,
      collaborator,
    };
    setSavedViews((prev) => [view, ...prev.filter((v) => v.name !== name)].slice(0, 12));
    setNewViewName("");
  };

  const applyView = (view: SavedView) => {
    setSelectedYears(view.selectedYears);
    setSelectedMonths(view.selectedMonths);
    setSelectedBrands(view.selectedBrands);
    setSelectedRoles(view.selectedRoles);
    setSelectedEconomy(view.selectedEconomy);
    setCollaborator(view.collaborator);
  };

  const clearFilters = () => {
    setSelectedYears([]);
    setSelectedMonths([]);
    setSelectedBrands([]);
    setSelectedRoles([]);
    setSelectedEconomy([]);
    setCollaborator("");
  };

  const exportCsv = () => {
    const headers = [
      "Competencia",
      "Ano",
      "Mes",
      "Colaborador",
      "Matricula",
      "Marca",
      "Cargo",
      "Valor",
      "Economia",
      "Com Economia",
    ];

    const lines = filtered.map((row) => [
      row.competence,
      String(row.year),
      String(row.month),
      row.employeeName,
      row.employeeId,
      row.brand,
      row.role,
      row.amount.toFixed(2),
      row.economyAmount.toFixed(2),
      row.hasEconomy ? "Sim" : "Nao",
    ]);

    const csv = [headers, ...lines]
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vt-dashboard-filtrado.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXlsx = () => {
    const rows = filtered.map((row) => ({
      competencia: row.competence,
      ano: row.year,
      mes: row.month,
      colaborador: row.employeeName,
      matricula: row.employeeId,
      marca: row.brand,
      cargo: row.role,
      valor: row.amount,
      economia: row.economyAmount,
      com_economia: row.hasEconomy ? "Sim" : "Nao",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "VT");
    XLSX.writeFile(wb, "vt-dashboard-filtrado.xlsx");
  };

  const maxValue = (items: readonly (readonly [string, number])[]) =>
    Math.max(...items.map(([, value]) => value), 1);

  const maxMarca = maxValue(stats.custoPorMarca);
  const maxCargo = maxValue(stats.subtotalCargo);
  const maxEconomiaMarca = maxValue(stats.economiaPorMarca);
  const maxTrend = Math.max(...stats.trendWithMovingAvg.map((t) => t.value), 1);
  const maxDist = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <section className={`indicator-page ${modeClass(mode)} space-y-4`}>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MultiFilter label="Ano" options={options.years} selected={selectedYears} onChange={setSelectedYears} />
        <MultiFilter label="Mes" options={options.months} selected={selectedMonths} onChange={setSelectedMonths} />
        <Input placeholder="Colaborador" value={collaborator} onChange={(event) => setCollaborator(event.target.value)} />
        <MultiFilter label="Marca" options={options.brands} selected={selectedBrands} onChange={setSelectedBrands} />
        <MultiFilter label="Cargo" options={options.roles} selected={selectedRoles} onChange={setSelectedRoles} />
        <MultiFilter label="Economia" options={options.economy} selected={selectedEconomy} onChange={setSelectedEconomy} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={clearFilters}>Limpar filtros</Button>
        <Button type="button" variant="outline" onClick={exportCsv}>Exportar CSV</Button>
        <Button type="button" variant="outline" onClick={exportXlsx}>Exportar XLSX</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Total" value={formatCurrencyCompact(stats.total)} icon={Bus} tone="cost" />
        <MetricCard label="Optantes por VT" value={String(stats.optantes)} icon={Users} tone="people" />
        <MetricCard label="Media de Custo Mensal" value={formatCurrencyCompact(stats.mediaMensal)} icon={CalendarDays} tone="cost" />
        <MetricCard label="Valor por colaborador/mes" value={formatCurrencyCompact(stats.valorPorColabMes)} icon={HandCoins} tone="cost" />
        <MetricCard label="Media de Custo por Colab" value={formatCurrencyCompact(stats.mediaPorColab)} icon={Users} tone="people" />
        <MetricCard label="Economia Acumulada" value={formatCurrencyCompact(stats.economyTotal)} icon={PiggyBank} tone="economy" />
      </div>

      {monthComparison ? (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold">Comparativo mensal ({monthComparison.monthA} vs {monthComparison.monthB})</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label={`Total ${monthComparison.monthA}`} value={formatCurrency(monthComparison.totalA)} icon={CalendarDays} tone="cost" />
            <MetricCard label={`Total ${monthComparison.monthB}`} value={formatCurrency(monthComparison.totalB)} icon={CalendarDays} tone="cost" />
            <MetricCard label="Variacao" value={`${formatCurrency(monthComparison.diffTotal)} (${formatPercent(monthComparison.diffPercent)})`} icon={ArrowUpDown} tone="percent" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ComparisonTable title="Comparativo por Marca" monthA={monthComparison.monthA} monthB={monthComparison.monthB} rows={monthComparison.byBrand} />
            <ComparisonTable title="Comparativo por Cargo" monthA={monthComparison.monthA} monthB={monthComparison.monthB} rows={monthComparison.byRole} />
          </div>
          <section className="rounded-xl border bg-background p-4">
            <h4 className="text-sm font-semibold">Waterfall de variacao por marca</h4>
            <div className="mt-2 space-y-2">
              {monthComparison.byBrand.slice(0, 10).map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="truncate pr-2">{row.label}</span>
                  <span className={row.diff >= 0 ? "text-rose-600" : "text-emerald-600"}>
                    {formatCurrency(row.diff)} ({formatPercent(row.diffPercent)})
                  </span>
                </div>
              ))}
            </div>
          </section>
        </section>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <RankingCard title="Custo por Marca (Acumulado)" items={stats.custoPorMarca} max={maxMarca} color="bg-sky-500" onClickLabel={(label) => setSelectedBrands([label])} />
            <RankingCard title="Subtotal Acumulado por Cargo" items={stats.subtotalCargo} max={maxCargo} color="bg-orange-400" onClickLabel={(label) => setSelectedRoles([label])} />
            <div className="xl:col-span-2">
              <RankingCard title="Economia por Marca" items={stats.economiaPorMarca} max={maxEconomiaMarca} color="bg-orange-500" onClickLabel={(label) => setSelectedBrands([label])} />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <SimpleListCard title="Custo por Mes" items={stats.custoMensalOrdenado} />
            <SimpleListCard title="Economia Mensal" items={stats.economiaMensalOrdenado} />
          </div>
        </>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-semibold">Tendencia (com media movel 3 meses)</h3>
        <div className="mt-3 space-y-2">
          {stats.trendWithMovingAvg.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>
          ) : (
            stats.trendWithMovingAvg.map((point) => (
              <div key={point.month} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{point.month}</span>
                  <span>
                    {formatCurrencyCompact(point.value)} | MM3: {formatCurrencyCompact(point.movingAvg)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-sky-500" style={{ width: `${Math.max((point.value / maxTrend) * 100, 4)}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 grid gap-3 md:grid-cols-2">
          <Select
            value={crossX}
            onChange={(event) => {
              setCrossX(event.target.value as GroupDimension);
              setCrossPage(1);
            }}
          >
            {Object.entries(dimensionLabels).map(([value, label]) => (
              <option key={`x-${value}`} value={value}>Eixo X: {label}</option>
            ))}
          </Select>
          <Select
            value={crossY}
            onChange={(event) => {
              setCrossY(event.target.value as GroupDimension);
              setCrossPage(1);
            }}
          >
            {Object.entries(dimensionLabels).map(([value, label]) => (
              <option key={`y-${value}`} value={value}>Eixo Y: {label}</option>
            ))}
          </Select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold">Cruzamento e comparacao</h3>
          <span className="text-xs text-muted-foreground">
            Pagina {crossPageSafe}/{crossTotalPages}
          </span>
        </div>
        <div className="mt-3 rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dimensionLabels[crossX]} \\ {dimensionLabels[crossY]}</TableHead>
                {crossing.colLabels.map((col) => (
                  <TableHead key={col}>{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {crossing.rowLabels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={Math.max(crossing.colLabels.length + 1, 2)} className="text-center text-muted-foreground">Sem dados para cruzamento.</TableCell>
                </TableRow>
              ) : (
                crossingRows.map((rowLabel) => (
                  <TableRow key={rowLabel}>
                    <TableCell className="font-medium">{rowLabel}</TableCell>
                    {crossing.colLabels.map((colLabel) => {
                      const key = `${rowLabel}|||${colLabel}`;
                      const cell = crossing.cellMap.get(key);
                      const avg =
                        cell && cell.people.size > 0 && cell.months.size > 0
                          ? cell.total / (cell.people.size * cell.months.size)
                          : 0;

                      return (
                        <TableCell key={key}>
                          <div>{cell ? formatCurrency(cell.total) : "-"}</div>
                          <div className="text-xs text-muted-foreground">{cell ? `Med/pessoa/mes: ${formatCurrency(avg)}` : ""}</div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {crossing.rowLabels.length > 0 ? (
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCrossPage((prev) => Math.max(prev - 1, 1))}
              disabled={crossPageSafe <= 1}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCrossPage((prev) => Math.min(prev + 1, crossTotalPages))}
              disabled={crossPageSafe >= crossTotalPages}
            >
              Proxima
            </Button>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold">Tabela analitica (custo medio por pessoa)</h3>
          <div className="flex items-center gap-2">
            <Select
              value={tableGroupBy}
              onChange={(event) => {
                setTableGroupBy(event.target.value as GroupDimension);
                setAnalyticPage(1);
              }}
              className="w-56"
            >
              {Object.entries(dimensionLabels).map(([value, label]) => (
                <option key={`g-${value}`} value={value}>Agrupar por {label}</option>
              ))}
            </Select>
            <span className="text-xs text-muted-foreground">
              Pagina {analyticPageSafe}/{analyticTotalPages}
            </span>
          </div>
        </div>

        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dimensionLabels[tableGroupBy]}</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pessoas</TableHead>
                <TableHead>Meses</TableHead>
                <TableHead>Registros</TableHead>
                <TableHead>Custo medio por pessoa/mes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyticTable.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">Sem dados para exibir.</TableCell>
                </TableRow>
              ) : (
                analyticRows.map((row) => (
                  <TableRow key={row.group}>
                    <TableCell className="font-medium">{row.group}</TableCell>
                    <TableCell>{formatCurrency(row.total)}</TableCell>
                    <TableCell>{row.peopleCount}</TableCell>
                    <TableCell>{row.monthsCount}</TableCell>
                    <TableCell>{row.records}</TableCell>
                    <TableCell>{formatCurrency(row.avgPerPerson)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {analyticTable.length > 0 ? (
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAnalyticPage((prev) => Math.max(prev - 1, 1))}
              disabled={analyticPageSafe <= 1}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAnalyticPage((prev) => Math.min(prev + 1, analyticTotalPages))}
              disabled={analyticPageSafe >= analyticTotalPages}
            >
              Proxima
            </Button>
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold">Outliers de custo medio</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Mediana: {formatCurrency(outliers.median)} | Q1: {formatCurrency(outliers.q1)} | Q3: {formatCurrency(outliers.q3)}
          </p>
          <div className="mt-3 space-y-2">
            {outliers.top.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum outlier identificado no recorte atual.</p>
            ) : (
              outliers.top.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <button type="button" className="text-left text-sky-700 hover:underline" onClick={() => setCollaborator(item.name)}>
                    {item.name}
                  </button>
                  <span>{formatCurrency(item.avg)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold">Distribuicao (custo medio por pessoa)</h3>
          <div className="mt-3 space-y-2">
            {distribution.map((bucket) => (
              <div key={bucket.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{bucket.label}</span>
                  <span>{bucket.count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-indigo-400" style={{ width: `${Math.max((bucket.count / maxDist) * 100, 3)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-semibold">Qualidade dos dados</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
          <QualityItem label="Sem colaborador" value={dataQuality.missingEmployee} />
          <QualityItem label="Valor <= 0" value={dataQuality.nonPositiveAmount} />
          <QualityItem label="Mes invalido" value={dataQuality.invalidMonth} />
          <QualityItem label="Economia inconsistente" value={dataQuality.economyMismatch} />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-semibold">Visoes salvas</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input placeholder="Nome da visão" value={newViewName} onChange={(e) => setNewViewName(e.target.value)} className="w-64" />
          <Button type="button" onClick={saveCurrentView}>Salvar visão atual</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {savedViews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma visão salva.</p>
          ) : (
            savedViews.map((view) => (
              <Button key={view.name} type="button" variant="outline" onClick={() => applyView(view)}>
                {view.name}
              </Button>
            ))
          )}
        </div>
      </section>

      <AiInsightsBox benefit="transport" context={insightsContext} />

      <p className="text-xs text-muted-foreground">Registros filtrados: {filtered.length}</p>
    </section>
  );
}

type MetricTone = "cost" | "people" | "economy" | "percent" | "neutral";

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: MetricTone;
}) {
  return (
    <div className={`indicator-metric indicator-metric-${tone}`}>
      {Icon ? (
        <div className="indicator-metric-icon">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function QualityItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${value > 0 ? "text-rose-600" : "text-emerald-600"}`}>{value}</p>
    </div>
  );
}

function ComparisonTable({
  title,
  monthA,
  monthB,
  rows,
}: {
  title: string;
  monthA: string;
  monthB: string;
  rows: ComparisonRow[];
}) {
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <section className="rounded-2xl border border-border bg-background p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
        <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-700">{title}</h4>
      </div>
      <div className="mb-2 text-right text-xs text-muted-foreground">
        Pagina {safePage}/{totalPages}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Grupo</TableHead>
            <TableHead>{monthA}</TableHead>
            <TableHead>{monthB}</TableHead>
            <TableHead>Dif.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados.</TableCell>
            </TableRow>
          ) : (
            pagedRows.map((row) => (
              <TableRow key={row.label}>
                <TableCell>{row.label}</TableCell>
                <TableCell>{formatCurrency(row.monthA)}</TableCell>
                <TableCell>{formatCurrency(row.monthB)}</TableCell>
                <TableCell>{formatCurrency(row.diff)} ({formatPercent(row.diffPercent)})</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {rows.length > 0 ? (
        <div className="mt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={safePage <= 1}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={safePage >= totalPages}
          >
            Proxima
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function RankingCard({
  title,
  items,
  max,
  color,
  onClickLabel,
}: {
  title: string;
  items: ReadonlyArray<readonly [string, number]>;
  max: number;
  color: string;
  onClickLabel?: (label: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-700">{title}</h3>
      </div>
      <div className="mt-3 max-h-80 space-y-2 overflow-auto pr-1">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>
        ) : (
          items.map(([label, value]) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                {onClickLabel ? (
                  <button type="button" className="truncate pr-2 text-left text-sky-700 hover:underline" onClick={() => onClickLabel(label)}>
                    {label}
                  </button>
                ) : (
                  <span className="truncate pr-2">{label}</span>
                )}
                <span className="text-muted-foreground">{formatCurrencyCompact(value)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.max((value / max) * 100, 4)}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function SimpleListCard({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<readonly [string, number]>;
}) {
  const max = Math.max(...items.map(([, value]) => value), 1);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
        <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-700">{title}</h3>
      </div>
      <div className="mt-3 max-h-80 space-y-2 overflow-auto pr-1">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>
        ) : (
          items.map(([label, value]) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{label}</span>
                <span className="font-medium">{formatCurrencyCompact(value)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-indigo-500"
                  style={{ width: `${Math.max((value / max) * 100, 4)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
