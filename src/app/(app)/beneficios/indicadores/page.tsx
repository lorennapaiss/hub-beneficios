import { PageHeader } from "@/components/page-header";
import { IndicatorsWorkspace } from "@/components/indicators/workspace";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getIndicatorsOverviewData } from "@/server/indicators/dashboard";
import {
  logIndicatorsAuthorizationEvent,
  requireIndicatorsAccess,
} from "@/server/indicators/access";

export const dynamic = "force-dynamic";

export default async function IndicadoresPage() {
  const { session, scope } = await requireIndicatorsAccess();

  if (!scope?.canAccess) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Indicadores de Beneficios"
          description="Acesso restrito por escopo de marca."
        />
        <Card className="border-dashed shadow-none">
          <CardHeader>
            <CardTitle>Acesso indisponivel</CardTitle>
            <CardDescription>
              Voce nao possui marcas vinculadas para visualizar esta pagina.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Solicite a associacao da sua conta a uma ou mais marcas para liberar o modulo.
          </CardContent>
        </Card>
      </div>
    );
  }

  await logIndicatorsAuthorizationEvent({
    action: "INDICATORS_ACCESS_GRANTED",
    createdBy: session?.user?.email ?? scope.email,
    metadata: {
      role: scope.isAdmin ? "ADMIN" : "BRAND_SCOPE",
      allowedBrands: scope.allowedBrands,
      path: "/beneficios/indicadores",
    },
  });

  const dashboard = await getIndicatorsOverviewData(scope);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Indicadores de Beneficios"
        description={
          scope.isAdmin
            ? "Visual corporativo com acesso consolidado a todas as marcas."
            : `Dados filtrados automaticamente para: ${scope.allowedBrands.join(", ")}.`
        }
      />
      <IndicatorsWorkspace
        dashboard={dashboard}
        allowedBrands={scope.allowedBrands}
        isAdmin={scope.isAdmin}
      />
    </div>
  );
}
