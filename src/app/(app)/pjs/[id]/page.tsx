import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PjDetailView } from "@/components/pjs/pj-detail-view";
import { getPjDetailById } from "@/server/pjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteParams = {
  params: Promise<{ id: string }>;
};

export default async function PjDetailPage({ params }: RouteParams) {
  const { id } = await params;
  const detail = await getPjDetailById(id);
  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.pj.nome_completo}
        description="Ficha consolidada com cadastro, empresa, custo, beneficios e historico."
        actions={
          <Button asChild>
            <Link href={`/pjs/${detail.pj.pj_id}/edit`}>Editar PJ</Link>
          </Button>
        }
      />
      <PjDetailView detail={detail} />
    </div>
  );
}
