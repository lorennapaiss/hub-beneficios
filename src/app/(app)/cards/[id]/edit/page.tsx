import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { CardForm } from "@/components/cards/card-form";
import { getCardById } from "@/server/cards";

export const dynamic = "force-dynamic";
export const revalidate = 0;


type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditCardPage({ params }: RouteParams) {
  const { id } = await params;
  const card = await getCardById(id);
  if (!card) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar cartao"
        description="Atualize os dados do cartao."
      />
      <div className="rounded-lg border border-border bg-card p-6">
        <CardForm
          mode="edit"
          cardId={card.card_id}
          initialValues={{
            numero_cartao: card.numero_cartao,
            marca: card.marca,
            unidade: card.unidade,
            status: card.status as "ESTOQUE" | "ALOCADO" | "BLOQUEADO" | "INATIVO",
            foto_cartao_url: card.foto_cartao_url,
            observacoes: card.observacoes,
          }}
        />
      </div>
    </div>
  );
}
