import { PageHeader } from "@/components/page-header";
import { CardForm } from "@/components/cards/card-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;


export default function NewCardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Novo cartão" description="Cadastro de cartão provisório." />
      <div className="rounded-lg border border-border bg-card p-6">
        <CardForm mode="create" />
      </div>
    </div>
  );
}
