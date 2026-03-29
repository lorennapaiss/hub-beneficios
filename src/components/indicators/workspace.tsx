"use client";

import dynamic from "next/dynamic";
import { startTransition, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/lib/hooks/use-api";
import type {
  IndicatorDetailResponse,
  IndicatorsOverviewData,
} from "@/server/indicators/dashboard";

type BenefitKey = "health" | "dental" | "transport" | "meal";

type IndicatorsWorkspaceProps = {
  dashboard: IndicatorsOverviewData;
  allowedBrands: string[];
  isAdmin: boolean;
};

type DetailResponseEnvelope<K extends BenefitKey = BenefitKey> = {
  data: IndicatorDetailResponse<K>;
  meta: {
    benefit: K;
    cache: string;
    generatedAt: string;
  };
};

const HealthDashboard = dynamic(
  () => import("@/components/indicators/health-dashboard").then((mod) => mod.HealthDashboard),
  { loading: () => <DashboardPanelSkeleton /> },
);
const DentalDashboard = dynamic(
  () => import("@/components/indicators/dental-dashboard").then((mod) => mod.DentalDashboard),
  { loading: () => <DashboardPanelSkeleton /> },
);
const MealDashboard = dynamic(
  () => import("@/components/indicators/meal-dashboard").then((mod) => mod.MealDashboard),
  { loading: () => <DashboardPanelSkeleton /> },
);
const VtDashboard = dynamic(
  () => import("@/components/indicators/vt-dashboard").then((mod) => mod.VtDashboard),
  { loading: () => <DashboardPanelSkeleton /> },
);

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

export function IndicatorsWorkspace({
  dashboard,
  allowedBrands,
  isAdmin,
}: IndicatorsWorkspaceProps) {
  const defaultTab = (dashboard.benefitDashboards[0]?.key ?? "health") as BenefitKey;
  const { request } = useApi();
  const [activeTab, setActiveTab] = useState<BenefitKey>(defaultTab);
  const [detailByBenefit, setDetailByBenefit] = useState<
    Partial<Record<BenefitKey, IndicatorDetailResponse>>
  >({});
  const [loadingBenefit, setLoadingBenefit] = useState<BenefitKey | null>(defaultTab);
  const [detailError, setDetailError] = useState<string | null>(null);
  const mode: "A" | "B" | "C" = "B";

  useEffect(() => {
    if (detailByBenefit[activeTab]) return;

    const controller = new AbortController();

    request<DetailResponseEnvelope>(
      `/api/indicators/${activeTab}`,
      { signal: controller.signal },
      {
        cacheKey: `indicators:detail:${activeTab}`,
        cacheTtlMs: 5 * 60 * 1000,
      },
    )
      .then((response) => {
        setDetailByBenefit((current) => ({
          ...current,
          [activeTab]: response.data,
        }));
        setDetailError(null);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setDetailError(error instanceof Error ? error.message : "Falha ao carregar painel.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingBenefit((current) => (current === activeTab ? null : current));
        }
      });

    return () => controller.abort();
  }, [activeTab, detailByBenefit, request]);

  const activeDetail = detailByBenefit[activeTab];
  const activeWarnings = useMemo(() => {
    const warnings = new Set(dashboard.warnings);
    for (const warning of activeDetail?.warnings ?? []) {
      warnings.add(warning);
    }
    return Array.from(warnings);
  }, [activeDetail?.warnings, dashboard.warnings]);

  return (
    <div className="indicator-shell indicator-layout-b space-y-6">
      {activeWarnings.length > 0 ? (
        <div className="indicator-alert">
          <p className="font-semibold">Avisos de integração</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {activeWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-12">
        {!isAdmin ? (
          <div className="indicator-kpi-card xl:col-span-12">
            <p className="indicator-kpi-label">Escopo autorizado</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {allowedBrands.length === 1
                ? `Marca travada: ${allowedBrands[0]}`
                : `Marcas autorizadas: ${allowedBrands.join(", ")}`}
            </p>
          </div>
        ) : null}

        <div className="indicator-kpi-hero xl:col-span-6">
          <p className="indicator-kpi-label">Custo total geral</p>
          <p className="indicator-kpi-value">{formatCurrency(dashboard.totalCurrent)}</p>
          <div className={`mt-1 text-sm font-semibold ${variationClass(dashboard.totalVariationPercent)}`}>
            {formatPercent(dashboard.totalVariationPercent)}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Competência {dashboard.competenceCurrent} vs{" "}
            {dashboard.competencePrevious ?? "sem base anterior"}
          </p>
        </div>

        <div className="indicator-kpi-card xl:col-span-3">
          <p className="indicator-kpi-label">Competência atual</p>
          <p className="text-2xl font-semibold text-foreground">{dashboard.competenceCurrent}</p>
        </div>

        <div className="indicator-kpi-card xl:col-span-3">
          <p className="indicator-kpi-label">Mês anterior</p>
          <p className="text-2xl font-semibold text-foreground">
            {formatCurrency(dashboard.totalPrevious)}
          </p>
        </div>

        <div className="indicator-kpi-card xl:col-span-12">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {dashboard.benefitSummaries.map((item) => (
              <div key={item.key} className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="indicator-kpi-label">{item.label}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatCurrency(item.totalCurrent)}
                </p>
                <p className={`text-xs font-semibold ${variationClass(item.variationPercent)}`}>
                  {formatPercent(item.variationPercent)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          startTransition(() => {
            const nextValue = value as BenefitKey;
            setActiveTab(nextValue);
            setLoadingBenefit(detailByBenefit[nextValue] ? null : nextValue);
            setDetailError(null);
          });
        }}
        className="space-y-4"
      >
        <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b border-border pb-0.5">
          {dashboard.benefitDashboards.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="px-4">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {dashboard.benefitDashboards.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="space-y-4">
            {activeTab === tab.key ? (
              <ActiveDashboardPanel
                benefit={tab.key as BenefitKey}
                detail={activeDetail}
                loading={loadingBenefit === tab.key && !activeDetail}
                error={detailError}
                mode={mode}
              />
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ActiveDashboardPanel({
  benefit,
  detail,
  loading,
  error,
  mode,
}: {
  benefit: BenefitKey;
  detail?: IndicatorDetailResponse;
  loading: boolean;
  error: string | null;
  mode: "A" | "B" | "C";
}) {
  if (loading) {
    return <DashboardPanelSkeleton />;
  }

  if (error) {
    return (
      <StatusCard
        title="Falha ao carregar detalhamento"
        description={error}
      />
    );
  }

  if (!detail) {
    return (
      <StatusCard
        title="Detalhamento indisponível"
        description="Nenhum dado detalhado foi retornado para este benefício."
      />
    );
  }

  if (benefit === "health" && detail.key === "health") {
    return (
      <HealthDashboard
        records={detail.healthRecords}
        copartRecords={detail.healthCopartRecords}
        mode={mode}
      />
    );
  }

  if (benefit === "transport" && detail.key === "transport") {
    return <VtDashboard records={detail.transportRecords} mode={mode} />;
  }

  if (benefit === "dental" && detail.key === "dental") {
    return <DentalDashboard records={detail.dentalRecords} mode={mode} />;
  }

  if (benefit === "meal" && detail.key === "meal") {
    return <MealDashboard records={detail.mealRecords} mode={mode} />;
  }

  return (
    <StatusCard
      title="Painel incompatível"
      description="O payload retornado não corresponde ao benefício selecionado."
    />
  );
}

function DashboardPanelSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-xl bg-slate-200/70" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

function StatusCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border-dashed shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-20 rounded-xl border border-dashed border-border bg-muted/40" />
      </CardContent>
    </Card>
  );
}
