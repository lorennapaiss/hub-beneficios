"use client";

import { useMemo } from "react";
import { HealthDashboard } from "@/components/indicators/health-dashboard";
import { DentalDashboard } from "@/components/indicators/dental-dashboard";
import { MealDashboard } from "@/components/indicators/meal-dashboard";
import { VtDashboard } from "@/components/indicators/vt-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { IndicatorsDashboardData } from "@/server/indicators/dashboard";

type IndicatorsWorkspaceProps = {
  dashboard: IndicatorsDashboardData;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatCurrency = (value: number) => currency.format(value);

const formatPercent = (value: number | null) => {
  if (value === null) return "N/A";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
};

const variationClass = (value: number | null) => {
  if (value === null) return "text-slate-500";
  if (value > 0) return "text-rose-600";
  if (value < 0) return "text-emerald-600";
  return "text-slate-500";
};

export function IndicatorsWorkspace({ dashboard }: IndicatorsWorkspaceProps) {
  const defaultTab = dashboard.benefitDashboards[0]?.key ?? "health";
  const mode: "A" | "B" | "C" = "B";

  const currentHealth = useMemo(
    () => dashboard.benefitDashboards.find((item) => item.key === "health"),
    [dashboard.benefitDashboards],
  );

  return (
    <div className="indicator-shell indicator-layout-b space-y-6">
      {dashboard.warnings.length > 0 ? (
        <div className="indicator-alert">
          <p className="font-semibold">Avisos de integração</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {dashboard.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="indicator-kpi-hero xl:col-span-6">
          <p className="indicator-kpi-label">Custo total geral</p>
          <p className="indicator-kpi-value">{formatCurrency(dashboard.totalCurrent)}</p>
          <div className={`text-sm font-semibold ${variationClass(dashboard.totalVariationPercent)}`}>
            {formatPercent(dashboard.totalVariationPercent)}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Competência {dashboard.competenceCurrent} vs {dashboard.competencePrevious ?? "sem base anterior"}
          </p>
        </div>

        <div className="indicator-kpi-card xl:col-span-3">
          <p className="indicator-kpi-label">Competência atual</p>
          <p className="text-2xl font-semibold text-slate-900">{dashboard.competenceCurrent}</p>
        </div>

        <div className="indicator-kpi-card xl:col-span-3">
          <p className="indicator-kpi-label">Mês anterior</p>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(dashboard.totalPrevious)}</p>
        </div>

        <div className="indicator-kpi-card xl:col-span-12">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {dashboard.benefitSummaries.map((item) => (
              <div key={item.key} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{item.label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(item.totalCurrent)}</p>
                <p className={`text-xs font-semibold ${variationClass(item.variationPercent)}`}>
                  {formatPercent(item.variationPercent)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b border-slate-200 pb-0.5">
          {dashboard.benefitDashboards.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="px-4">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {dashboard.benefitDashboards.map((tab) => {
          if (tab.key === "health") {
            return (
              <TabsContent key={tab.key} value={tab.key} className="space-y-4">
                <HealthDashboard
                  records={dashboard.healthRecords}
                  copartRecords={dashboard.healthCopartRecords}
                  mode={mode}
                />
              </TabsContent>
            );
          }

          if (tab.key === "transport") {
            return (
              <TabsContent key={tab.key} value={tab.key} className="space-y-4">
                <VtDashboard records={dashboard.transportRecords} mode={mode} />
              </TabsContent>
            );
          }

          if (tab.key === "dental") {
            return (
              <TabsContent key={tab.key} value={tab.key} className="space-y-4">
                <DentalDashboard records={dashboard.dentalRecords} mode={mode} />
              </TabsContent>
            );
          }

          if (tab.key === "meal") {
            return (
              <TabsContent key={tab.key} value={tab.key} className="space-y-4">
                <MealDashboard records={dashboard.mealRecords} mode={mode} />
              </TabsContent>
            );
          }

          return (
            <TabsContent key={tab.key} value={tab.key} className="space-y-4">
              <section className="indicator-kpi-card">
                <p className="indicator-kpi-label">Resumo</p>
                <p className="text-lg text-slate-700">
                  Esse módulo ainda está no layout legado. Mantive todas as métricas e naveguei primeiro por Saúde e VT no novo visual.
                </p>
                {tab.key === "health" && currentHealth ? (
                  <p className="mt-2 text-sm text-slate-500">
                    Custo médio por vida: {formatCurrency(currentHealth.averageCostPerPerson ?? 0)}
                  </p>
                ) : null}
              </section>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
