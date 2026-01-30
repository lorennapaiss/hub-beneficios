import { PageHeader } from "@/components/page-header";
import { PersonForm } from "@/components/people/person-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;


export default function NewPersonPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Nova pessoa" description="Cadastro de colaborador." />
      <div className="rounded-lg border border-border bg-card p-6">
        <PersonForm mode="create" />
      </div>
    </div>
  );
}
