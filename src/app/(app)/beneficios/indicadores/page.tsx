import { PageHeader } from "@/components/page-header";
import { IndicatorsWorkspace } from "@/components/indicators/workspace";
import { getIndicatorsOverviewData } from "@/server/indicators/dashboard";

export const dynamic = "force-dynamic";

export default async function IndicadoresPage() {
  const dashboard = await getIndicatorsOverviewData();

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
