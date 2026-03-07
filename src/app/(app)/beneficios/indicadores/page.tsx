import { PageHeader } from "@/components/page-header";
import { IndicatorsWorkspace } from "@/components/indicators/workspace";
import { getIndicatorsDashboardData } from "@/server/indicators/dashboard";

export const dynamic = "force-dynamic";

export default async function IndicadoresPage() {
  const dashboard = await getIndicatorsDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Indicadores de Benefícios"
        description="Visual corporativo com hierarquia executiva, comparativos e detalhamento analítico."
      />
      <IndicatorsWorkspace dashboard={dashboard} />
    </div>
  );
}
