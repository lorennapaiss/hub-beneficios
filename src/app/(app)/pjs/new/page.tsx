import { PageHeader } from "@/components/page-header";
import { PjForm } from "@/components/pjs/pj-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function NewPjPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Novo PJ" description="Cadastro principal de profissional PJ." />
      <div className="rounded-lg border border-border bg-card p-6">
        <PjForm mode="create" />
      </div>
    </div>
  );
}
